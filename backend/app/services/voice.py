import json
import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.menu import ThucDon
from app.models.order import PhienBan
from app.models.voice import LogGiongNoi
from app.schemas.voice import (
    VoiceAdd,
    VoiceAmbiguity,
    VoiceDraftChange,
    VoiceDraftNoteUpdate,
    VoiceInterpretIn,
    VoiceInterpretOut,
    VoiceNeedsQuantity,
    VoiceOos,
    VoicePendingDraftRemoval,
    VoiceRecommendation,
    VoiceStockLimit,
    VoiceWarning,
)

QUANTITIES = {
    "mot": 1, "hai": 2, "ba": 3, "bon": 4, "tu": 4, "nam": 5,
    "sau": 6, "bay": 7, "tam": 8, "chin": 9, "muoi": 10,
}
ALLERGEN_ALIASES = {
    "tôm": ("tom", "hai san", "seafood", "shrimp", "prawn"),
    "hải sản": ("hai san", "seafood"),
    "trứng": ("trung", "egg"),
    "đậu phộng": ("dau phong", "lac", "peanut"),
    "sữa": ("sua", "milk", "dairy"),
    "gluten": ("gluten", "lua mi"),
}
ALLERGY_TRIGGERS = {
    "tôm": ("tom", "shrimp", "prawn"),
    "hải sản": ("hai san", "seafood"),
    "trứng": ("trung", "egg"),
    "đậu phộng": ("dau phong", "lac", "peanut"),
    "sữa": ("sua", "milk", "dairy"),
    "gluten": ("gluten", "lua mi"),
}
NOTE_PATTERN = re.compile(
    r"chia\s+đôi\s+phần"
    r"|không\s+(?:lấy\s+)?(?:hành|rau|đá|ớt|tiêu)"
    r"|bỏ\s+(?:hành|rau|đá|ớt|tiêu)"
    r"|ít\s+(?:cay|ngọt|đá|rau|hành)"
    r"|nhiều\s+cay"
    r"|thêm\s+(?:đá|nước|tương|ớt)",
    re.IGNORECASE,
)
SEGMENT_SPLIT = re.compile(r"[,;\n]+|\s+(?:và|với|rồi)\s+", re.IGNORECASE)
FILLER_WORDS = {
    "toi", "minh", "muon", "an", "uong", "cho", "lay", "them", "goi", "y",
    "tu", "van", "nen", "giup", "tim", "voi", "mot", "phan", "suat", "ly",
    "chai", "coc", "bat", "dia", "mon", "do", "nha", "hang", "quan", "co",
    "nao", "gi", "di", "nhe", "a",
}


def normalize(text: str) -> str:
    value = unicodedata.normalize("NFD", text.lower())
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    return re.sub(r"đ", "d", value)


def _quantity_and_text(segment: str) -> tuple[int, str, bool]:
    """Return (quantity, remainder_text, qty_was_explicit)."""
    cleaned = re.sub(r"^\s*(?:cho|thêm|lấy|order)\s+", "", segment, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*(?:tôi|mình|anh/chị|anh chị)\s+", "", cleaned, flags=re.IGNORECASE)
    match = re.match(r"^\s*(\d+|[\wÀ-ỹ]+)\b\s*", cleaned, flags=re.IGNORECASE)
    if not match:
        return 1, cleaned, False
    quantity_word = normalize(match.group(1))
    if not quantity_word.isdigit() and quantity_word not in QUANTITIES:
        return 1, cleaned, False
    quantity = int(quantity_word) if quantity_word.isdigit() else QUANTITIES[quantity_word]
    remainder = cleaned[match.end():]
    remainder = re.sub(
        r"^\s*(?:phần|suất|ly|chai|cốc|bát|đĩa)\s+", "", remainder, flags=re.IGNORECASE
    )
    return max(quantity, 1), remainder, True


def _segments(transcript: str, dishes: list[ThucDon]) -> list[str]:
    parts = [part.strip() for part in SEGMENT_SPLIT.split(transcript) if part.strip()]
    result: list[str] = []
    for part in parts:
        if result and NOTE_PATTERN.match(part) and _full_name_matches(result[-1], dishes):
            result[-1] = f"{result[-1]} {part}"
        else:
            result.append(part)
    return result


def _full_name_matches(text: str, dishes: list[ThucDon]) -> list[ThucDon]:
    normalized = normalize(text)
    return [dish for dish in dishes if normalize(dish.tenmon) in normalized]


def _lookup_query(text: str) -> str:
    query = normalize(NOTE_PATTERN.sub(" ", text))
    query = re.sub(
        r"^(?:toi muon an|minh muon an|toi muon|minh muon|goi y|tu van|"
        r"cho toi|cho minh|toi can|minh can|tim mon|co mon|mon nao co)\s+",
        "",
        query,
    )
    tokens = [token for token in re.findall(r"[a-z0-9]+", query) if token not in FILLER_WORDS]
    if "nuoc" in tokens or {"do", "uong"}.issubset(tokens):
        return "nuoc"
    return " ".join(tokens)


def _keyword_matches(query: str, dishes: list[ThucDon]) -> list[ThucDon]:
    tokens = set(re.findall(r"[a-z0-9]+", query))
    if not tokens:
        return []
    matches = []
    for dish in dishes:
        searchable = normalize(
            " ".join(
                filter(
                    None,
                    (dish.tenmon, dish.thanhphan, dish.mota, dish.phanloai),
                )
            )
        )
        available_tokens = set(re.findall(r"[a-z0-9]+", searchable))
        is_beverage_search = "nuoc" in tokens and normalize(dish.phanloai or "") == "do uong"
        if is_beverage_search or tokens.issubset(available_tokens):
            matches.append(dish)
    return matches


def _resolve_dish(text: str, dishes: list[ThucDon]) -> tuple[ThucDon | None, list[ThucDon], bool]:
    """Return (exact dish, candidates, is ingredient/search request)."""
    normalized = normalize(text)
    full_matches = _full_name_matches(normalized, dishes)
    if full_matches:
        longest = max(len(normalize(dish.tenmon)) for dish in full_matches)
        candidates = [dish for dish in full_matches if len(normalize(dish.tenmon)) == longest]
        if len(candidates) == 1:
            return candidates[0], candidates, False

    query = _lookup_query(text)
    if query in {"bo xao", "thit bo xao"}:
        # Phrase này được người dùng dùng như cách gọi mơ hồ cho nhóm món bò.
        candidates = [
            dish for dish in dishes
            if "bo" in normalize(dish.tenmon)
            and any(token in normalize(dish.tenmon) for token in ("xao", "sot"))
        ]
        return (candidates[0] if len(candidates) == 1 else None), candidates, False

    query_tokens = query.split()
    if len(query_tokens) >= 2:
        named = [
            dish for dish in dishes
            if query in normalize(dish.tenmon)
            or set(query_tokens).issubset(set(re.findall(r"[a-z0-9]+", normalize(dish.tenmon))))
        ]
        if named:
            if len(named) == 1:
                return named[0], named, False
            return None, named, False

    return None, _keyword_matches(query, dishes), True


def _allergies_in(transcript: str) -> list[str]:
    normalized = normalize(transcript)
    return [
        allergen
        for allergen, aliases in ALLERGY_TRIGGERS.items()
        if any(
            re.search(r"di ung(?: voi)?\s+(?:toi\s+)?" + re.escape(alias) + r"\b", normalized)
            for alias in aliases
        )
    ]


def _dish_contains_allergen(dish: ThucDon, allergen: str) -> bool:
    content = normalize(" ".join(filter(None, (dish.thanhphan, dish.thongtindiung))))
    aliases = ALLERGEN_ALIASES.get(allergen, (normalize(allergen),))
    return any(alias in content for alias in aliases)


def _beverage_inquiry(text: str) -> bool:
    normalized = normalize(text)
    return any(term in normalized for term in (
        "nuoc uong", "giai khat", "do uong", "uong gi", "nuoc gi",
    ))


def _soup_inquiry(text: str) -> bool:
    normalized = normalize(text)
    return any(term in normalized for term in (
        "sup", "nuoc dung", "nuoc leo", "mon nao co nuoc", "mon co nuoc",
        "mon gi co nuoc", "co mon nuoc",
    ))


def _affirmative(text: str) -> bool:
    normalized = normalize(text)
    return any(term in normalized for term in (
        "xoa di", "bo di", "bo mon", "xoa mon", "xoa no", "duoc xoa",
        "hay xoa", "dung xoa", "ok xoa", "uh xoa", "u xoa", "vang xoa",
        "co xoa", "xoa giup",
    )) or normalized.strip() in {"co", "vang", "duoc", "ok", "u", "uh", "roi"}


def _negative(text: str) -> bool:
    normalized = normalize(text)
    return any(term in normalized for term in (
        "khong xoa", "dung xoa", "giu lai", "de lai", "khong can",
    ))


def _recommendation(dish: ThucDon) -> VoiceRecommendation:
    return VoiceRecommendation(id=dish.id, name=dish.tenmon, price=int(dish.giaban))


def _draft_dish_mentions(text: str, draft_dishes: list[ThucDon]) -> list[ThucDon]:
    normalized = normalize(text)
    matches = [dish for dish in draft_dishes if normalize(dish.tenmon) in normalized]
    if matches:
        longest = max(len(normalize(dish.tenmon)) for dish in matches)
        return [dish for dish in matches if len(normalize(dish.tenmon)) == longest]
    if len(draft_dishes) == 1 and any(
        phrase in normalized for phrase in ("mon nay", "mon do", "mon trong gio", "mon dang chon")
    ):
        return draft_dishes
    return []


def _note_for(segment: str) -> str:
    canonical = {
        "khong hanh": "Không hành", "khong lay hanh": "Không hành",
        "bo hanh": "Không hành",
        "khong rau": "Không rau", "khong lay rau": "Không rau",
        "bo rau": "Không rau",
        "it cay": "Ít cay", "nhieu cay": "Nhiều cay",
        "khong da": "Không đá", "khong lay da": "Không đá",
        "it da": "Ít đá",
        "it ngot": "Ít ngọt",
        "chia doi phan": "Chia đôi phần",
        "khong ot": "Không ớt", "bo ot": "Không ớt",
        "khong tieu": "Không tiêu", "bo tieu": "Không tiêu",
        "them da": "Thêm đá", "them nuoc": "Thêm nước",
        "them tuong": "Thêm tương", "them ot": "Thêm ớt",
        "it hanh": "Ít hành", "it rau": "Ít rau",
    }
    notes = []
    for raw_note in NOTE_PATTERN.findall(segment):
        key = normalize(raw_note)
        note = canonical.get(key, raw_note.strip().capitalize())
        if note not in notes:
            notes.append(note)
    return ", ".join(notes)


def _quantity_value(value: str) -> int | None:
    normalized = normalize(value.strip())
    return int(normalized) if normalized.isdigit() else QUANTITIES.get(normalized)


def _is_modifier_only(transcript: str) -> bool:
    """True khi transcript chỉ chứa modifier/note, không có tên món rõ ràng."""
    stripped = NOTE_PATTERN.sub("", transcript).strip()
    # Loại bỏ các từ đệm thường gặp
    filler_re = re.compile(
        r"\b(nữa|thôi|nhé|nhủa|nha|ạ|là|cho|món|cái|đó|này|vậy|được|ok)\b",
        re.IGNORECASE,
    )
    stripped = filler_re.sub("", stripped).strip()
    return len(stripped) < 4  # Chỉ còn từ rất ngắn/trống sau khi bỏ modifier


def _friendly_candidates(dishes: list[ThucDon]) -> str:
    names = [dish.tenmon for dish in dishes]
    if len(names) == 2:
        return f"{names[0]} và {names[1]}"
    if len(names) > 2:
        return f"{', '.join(names[:-1])} và {names[-1]}"
    return names[0] if names else "món phù hợp"


def _build_gemini_system_prompt(
    dishes: list[ThucDon],
    draft_quantities: dict[str, int],
    draft_lines: list | None = None,
    last_added_item_id: str | None = None,
) -> str:
    """Tạo system prompt cho Gemini dựa trên dữ liệu menu thực tế từ DB."""
    menu_lines: list[str] = []
    for d in dishes:
        stock = d.so_phan_con  # mua sẵn: soluongton; chế biến: theo nguyên liệu
        if stock is not None:
            draft_used = draft_quantities.get(d.id, 0)
            available = max(stock - draft_used, 0)
            stock_str = f"Tồn kho: {available}"
        else:
            stock_str = "Tồn kho: không giới hạn"

        oos_str = " [HẾT HÀNG]" if d.het_hang else ""
        parts_list = [
            f"ID: {d.id}",
            f"Giá: {d.giaban:,}đ",
            stock_str,
        ]
        if d.thanhphan:
            parts_list.append(f"Thành phần: {d.thanhphan}")
        if d.thongtindiung:
            parts_list.append(f"Dị ứng: {d.thongtindiung}")
        if d.docay:
            parts_list.append(f"Vị: {d.docay}")
        menu_lines.append(f"- {d.tenmon}{oos_str} ({', '.join(parts_list)})")

    menu_block = "\n".join(menu_lines) if menu_lines else "(Không có món nào)"

    # Build current draft block for context
    if draft_lines:
        draft_display = []
        dish_map = {d.id: d for d in dishes}
        for line in draft_lines:
            dish = dish_map.get(line.item_id)
            name = dish.tenmon if dish else line.item_id
            note_str = f", ghi chú: {line.note}" if line.note else ""
            draft_display.append(f"  - {name} (ID: {line.item_id}), SL: {line.quantity}{note_str}")
        current_draft_block = "\n".join(draft_display) if draft_display else "(Giỏ nháp trống)"
    else:
        current_draft_block = "(Giỏ nháp trống)"

    # Build last_added_item_id block
    if last_added_item_id:
        dish_map_tmp = {d.id: d for d in dishes}
        last_dish = dish_map_tmp.get(last_added_item_id)
        last_added_item_id_block = (
            f"{last_dish.tenmon} (ID: {last_added_item_id})" if last_dish else last_added_item_id
        )
    else:
        last_added_item_id_block = "(không có)"

    return f"""Bạn là Trợ lý AI Voice Ordering thông minh, chuyên phục vụ gọi món tại nhà hàng.
Nhiệm vụ của bạn là phân tích văn bản đầu vào từ giọng nói của khách (transcript),
đối chiếu chặt chẽ với Dữ liệu Menu & Tồn kho từ Database,
sau đó trả về cấu trúc JSON chuẩn xác kèm thông điệp phản hồi thân thiện.

---
1. DỮ LIỆU MENU & TỒN KHO THỰC TẾ (GROUND TRUTH):
{menu_block}

---
2. CÁC QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES):
- BR-04 (Anti-hallucination): Tuyệt đối không tự bịa giá, không tự tạo món ngoài
  danh sách trên. Giá và tồn kho phải lấy 100% từ dữ liệu hệ thống cung cấp.
- BR-01 (Explicit Confirmation): AI chỉ có quyền đưa món vào Giỏ nháp (Order
  Draft). Nghiêm cấm tự động chốt đơn gửi bếp (KDS).
- BR-06 (Stock Limitation): Kiểm tra số lượng tồn kho. Nếu khách gọi vượt quá
  tồn kho, KHÔNG được thêm vượt mức, phải ép số lượng về giới hạn hoặc từ chối
  và thông báo lại.
- Các món đánh dấu [HẾT HÀNG] không được thêm vào đơn.

---
3. XỬ LÝ CÁC TÌNH HUỐNG (INTENTS):
A. TƯ VẤN THEO SỞ THÍCH / TỪ KHÓA CHUNG (Ingredient/Keyword Search):
   - Nếu khách nhắc đến nguyên liệu/từ khóa chung
     (VD: "Tôi muốn ăn cơm", "Có món nào chứa thịt bò không?"):
     + Dò trong phần thành phần/mô tả. Gợi ý món phù hợp.
     + Trả về intent: "suggestion"
B. KIỂM TRA DỊ ỨNG (Allergy Check):
   - Nếu khách khai báo dị ứng hoặc hỏi về thành phần:
     + Đối chiếu với dữ liệu thành phần. Cảnh báo nếu có.
     + Trả về intent: "order" kèm warnings (nếu có món khớp) hoặc "suggestion"
C. LÀM RÕ KHI MẬP MỜ (Ambiguity Handling):
   - Nếu câu nói khớp từ 2 món trở lên hoặc độ tin cậy thấp:
     + KHÔNG tự ý đoán món.
     + Hỏi lại khách.
     + Trả về intent: "order" với danh sách ambiguities
D. THÊM MÓN CHÍNH XÁC (Happy Path):
   - Nếu khách gọi tên món cụ thể, số lượng và ghi chú:
     + Trích xuất item_id, quantity, note.
     + note phải chứa đúng chuỗi chuẩn: "Không hành", "Không rau", "Không đá",
       "Ít cay", "Nhiều cay", "Ít ngọt", "Chia đôi phần", "Ít đá", "Thêm đá",
       "Không ớt", "Không tiêu" — tùy vào câu nói của khách.
     + Kiểm tra tồn kho. Nếu đủ, trả về intent: "order" với adds.
     + message xác nhận: "Dạ, em đã ghi chú [note] cho món [Tên món] ạ." (nếu có note)
       hoặc "Dạ, em đã thêm [qty] [Tên món] vào giỏ hàng ạ." (nếu không có note)
E. KẾT THÚC ĐẶT MÓN:
   - Nếu khách nói "xong rồi", "chọn món xong", "đặt xong":
     + Trả về intent: "finish", done: true
F. GHI CHÚ TÙY CHỈNH CHO MÓN ĐÃ CÓ TRONG GIỎ (Note for existing draft item):
   - Nếu khách đề cập tên món + ghi chú nhưng MÓN ĐÓ ĐÃ CÓ trong current_draft_items:
     (VD: "bún chả không hành", "coca không đá")
     + Đây là yêu cầu cập nhật ghi chú, KHÔNG phải thêm mới.
     + Trả về intent: "order" với draft_note_updates: [{{"item_id": "...", "note": "..."}}]
     + message: "Dạ, em đã ghi chú [note] cho món [Tên món] ạ."
G. GIẢM SỐ LƯỢNG MÓN TRONG GIỎ (Decrease Quantity):
   - Nếu khách yêu cầu giảm bớt số lượng một món đã có trong giỏ:
     (VD: "bỏ bớt 1 coca", "chỉ giữ lại 2 coca", "trừ bớt 1 phần bò xào")
     + Tính toán số lượng mới: nếu tuyệt đối ("chỉ giữ lại N") → new_qty = N;
       nếu tương đối ("bỏ bớt N") → new_qty = current - N.
     + Nếu new_qty > 0: trả về draft_changes: [{{"item_id": "...", "quantity": new_qty}}]
       message: "Dạ, em đã giảm xuống còn [N] [Tên món] trong giỏ hàng ạ."
     + Nếu new_qty <= 0: trả về remove_from_draft: ["item_id"]
       message: "Dạ, em đã xóa [Tên món] khỏi giỏ hàng cho anh/chị ạ."
H. XÓA MÓN KHỎI GIỎ (Hard Remove):
   - Nếu khách yêu cầu xóa hẳn một món:
     (VD: "hủy món này", "xóa coca giùm anh", "bỏ bún chả ra khỏi giỏ")
     + Trả về remove_from_draft: ["item_id"]
     + message: "Dạ, em đã xóa [Tên món] khỏi giỏ hàng cho anh/chị ạ."
I. GHI CHÚ BỔ SUNG KHÔNG KÈM TÊN MÓN (Cross-turn Modifier Update):
   - Nếu khách chỉ nói một ghi chú/modifier mà KHÔNG đề cập tên món cụ thể,
     và last_added_item_id được cung cấp (món vừa thêm ở lượt trước):
     (VD: "ít cay thôi", "không hành nha", "món bò đó không cay nha")
     + TUYỆT ĐỐI KHÔNG THÊM MÓN MỚI hay tăng số lượng.
     + Trả về draft_note_updates: [{{"item_id": last_added_item_id, "note": "..."}}]
     + message: "Dạ, em đã cập nhật ghi chú [note] cho món [Tên món] ạ."
J. HỎI LẠI KHI THIẾU SỐ LƯỢNG (Missing Quantity Clarification):
   - Nếu khách gọi tên một món cụ thể nhưng KHÔNG nói số lượng:
     (VD: "cho phần cơm chiên", "lấy bún chả", "bò xào cần")
     + KHÔNG tự gán mặc định là 1. PHẢI hỏi lại.
     + Trả về needs_quantity_for: {{"item_id": "...", "item_name": "..."}}
     + message: "Dạ, anh/chị muốn gọi mấy phần [Tên món] ạ?"
K. KIỂM TRA GIỎ HÀNG KHI KHAI BÁO DỊ ỨNG (Allergy Cart Check):
   - Khi khách khai báo dị ứng:
     + Kiểm tra current_draft_items. Nếu có món chứa thành phần dị ứng:
       Trả về warnings + pending_draft_removal, hỏi xóa không.
     + Nếu không có trong giỏ: Chỉ cảnh báo các món trong menu, KHÔNG hỏi xóa.
L. CHUYỂN CHỦ ĐỀ HỘI THOẠI (Context Shift — No Repetition):
   - Luôn trả lời trực tiếp vào yêu cầu MỚI NHẤT của khách.
   - TUYỆT ĐỐI KHÔNG nhắc lại câu hỏi cũ hoặc vấn đề đã giải quyết.
   - Nếu khách hỏi về điều khác sau khi vừa giải quyết xong (VD: hỏi về món, dị ứng, v.v.),
     hãy đáp thẳng vào nội dung đó, không đề cập lại lịch sử.

---
4. DỮ LIỆU GIỎ NHÁP HIỆN TẠI (CURRENT DRAFT — để xử lý F, G, H, I, J, K):
current_draft_items: {current_draft_block}
last_added_item_id: {last_added_item_id_block}

---
5. ĐỊNH DẠNG ĐẦU RA — CHỈ trả về JSON thuần túy, không thêm markdown hay giải thích:
{{
  "intent": "order | suggestion | recommendation | finish | unknown",
  "done": false,
  "message": "Câu phản hồi tự nhiên tiếng Việt thân thiện cho khách",
  "adds": [{{"id": "string", "name": "string", "qty": int, "note": "string",
             "price": int}}],
  "needs_quantity_for": {{"item_id": "string", "item_name": "string"}},
  "draft_note_updates": [{{"item_id": "string", "note": "string"}}],
  "draft_changes": [{{"item_id": "string", "quantity": int}}],
  "remove_from_draft": ["item_id"],
  "ambiguities": [{{"qty": int, "candidates": ["id1","id2"],
                   "segment": "string"}}],
  "oos": [{{"id": "string", "qty": int, "suggestions": ["id1"]}}],
  "stock_limits": [{{"item_id": "string", "item_name": "string",
                    "requested": int, "available": int}}],
  "not_found": ["string"],
  "warnings": [{{"item_id": "string", "item_name": "string",
                "allergen": "string", "message": "string"}}],
  "recommendations": [{{"id": "string", "name": "string", "price": int}}],
  "suggestions": [{{"id": "string", "name": "string", "price": int}}]
}}
Tất cả các mảng mặc định là [] nếu không có dữ liệu. "done" mặc định false.
needs_quantity_for mặc định là null nếu không cần hỏi lại.
"""


async def _gemini_interpret(
    transcript: str,
    dishes: list[ThucDon],
    draft_quantities: dict[str, int],
    draft_lines: list | None = None,
    last_added_item_id: str | None = None,
) -> dict | None:
    """Gọi Gemini API để phân tích transcript. Trả None nếu không có key hoặc lỗi."""
    if not settings.ai_api_key:
        return None
    try:
        from google import genai  # type: ignore[import]

        client = genai.Client(api_key=settings.ai_api_key)
        model = getattr(settings, "ai_model", None) or "gemini-2.0-flash"
        system_prompt = _build_gemini_system_prompt(
            dishes, draft_quantities, draft_lines, last_added_item_id
        )
        response = client.models.generate_content(
            model=model,
            contents=transcript,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
                max_output_tokens=1024,
            ),
        )
        raw = response.text.strip()
        # Bóc JSON ra khỏi markdown code block nếu có
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        return json.loads(raw)
    except Exception:
        return None


def _gemini_result_to_out(
    transcript: str,
    data: dict,
    dishes: list[ThucDon],
) -> VoiceInterpretOut:
    """Chuyển dict JSON từ Gemini sang VoiceInterpretOut, validate an toàn."""
    dish_map = {d.id: d for d in dishes}

    # Draft management from Gemini: remove, decrease, note update
    remove_from_draft: list[str] = [
        str(item_id) for item_id in (data.get("remove_from_draft") or [])
        if str(item_id) in dish_map
    ]
    draft_changes: list[VoiceDraftChange] = []
    for item in data.get("draft_changes") or []:
        iid = str(item.get("item_id", ""))
        if iid in dish_map:
            draft_changes.append(VoiceDraftChange(
                item_id=iid,
                quantity=max(int(item.get("quantity") or 0), 0),
            ))
    draft_note_updates: list[VoiceDraftNoteUpdate] = []
    for item in data.get("draft_note_updates") or []:
        iid = str(item.get("item_id", ""))
        if iid in dish_map:
            draft_note_updates.append(VoiceDraftNoteUpdate(
                item_id=iid,
                note=str(item.get("note") or ""),
            ))

    # needs_quantity_for from Gemini
    nqf_raw = data.get("needs_quantity_for")
    needs_quantity_for: VoiceNeedsQuantity | None = None
    if nqf_raw and isinstance(nqf_raw, dict):
        nqf_id = str(nqf_raw.get("item_id", ""))
        if nqf_id in dish_map:
            needs_quantity_for = VoiceNeedsQuantity(
                item_id=nqf_id,
                item_name=dish_map[nqf_id].tenmon,
            )

    adds: list[VoiceAdd] = []
    for item in data.get("adds") or []:
        dish = dish_map.get(str(item.get("id", "")))
        if dish:
            adds.append(VoiceAdd(
                id=dish.id,
                name=dish.tenmon,
                qty=max(int(item.get("qty") or 1), 1),
                note=str(item.get("note") or ""),
                price=int(dish.giaban),   # luôn dùng giá từ DB, bỏ qua giá AI trả về
            ))

    ambiguities: list[VoiceAmbiguity] = []
    for item in data.get("ambiguities") or []:
        cands = [str(c) for c in (item.get("candidates") or []) if str(c) in dish_map]
        if len(cands) >= 2:
            ambiguities.append(VoiceAmbiguity(
                qty=max(int(item.get("qty") or 1), 1),
                candidates=cands,
                segment=str(item.get("segment") or ""),
            ))

    oos: list[VoiceOos] = []
    for item in data.get("oos") or []:
        if str(item.get("id", "")) in dish_map:
            oos.append(VoiceOos(
                id=str(item["id"]),
                qty=max(int(item.get("qty") or 1), 1),
                suggestions=[str(s) for s in (item.get("suggestions") or []) if str(s) in dish_map],
            ))

    stock_limits: list[VoiceStockLimit] = []
    for item in data.get("stock_limits") or []:
        if str(item.get("item_id", "")) in dish_map:
            stock_limits.append(VoiceStockLimit(
                item_id=str(item["item_id"]),
                item_name=str(item.get("item_name") or dish_map[item["item_id"]].tenmon),
                requested=max(int(item.get("requested") or 1), 1),
                available=max(int(item.get("available") or 0), 0),
            ))

    warnings: list[VoiceWarning] = []
    for item in data.get("warnings") or []:
        if str(item.get("item_id", "")) in dish_map:
            warnings.append(VoiceWarning(
                item_id=str(item["item_id"]),
                item_name=str(item.get("item_name") or ""),
                allergen=str(item.get("allergen") or ""),
                message=str(item.get("message") or ""),
            ))

    def _to_recs(raw: list | None) -> list[VoiceRecommendation]:
        result = []
        for item in raw or []:
            dish = dish_map.get(str(item.get("id", "")))
            if dish:
                result.append(VoiceRecommendation(
                    id=dish.id, name=dish.tenmon, price=int(dish.giaban),
                ))
        return result

    intent_raw = str(data.get("intent") or "unknown")
    valid_intents = {
        "order", "suggestion", "recommendation",
        "ingredient_search", "finish", "unknown",
    }
    intent = intent_raw if intent_raw in valid_intents else "unknown"

    return VoiceInterpretOut(
        transcript=transcript,
        intent=intent,  # type: ignore[arg-type]
        adds=adds,
        ambiguities=ambiguities,
        oos=oos,
        stock_limits=stock_limits,
        not_found=[str(s) for s in (data.get("not_found") or [])],
        warnings=warnings,
        recommendations=_to_recs(data.get("recommendations")),
        suggestions=_to_recs(data.get("suggestions")),
        done=bool(data.get("done")),
        message=str(data.get("message") or "Dạ, anh/chị muốn dùng món nào ạ?"),
        remove_from_draft=remove_from_draft,
        draft_changes=draft_changes,
        draft_note_updates=draft_note_updates,
        needs_quantity_for=needs_quantity_for,
    )


async def interpret(db: AsyncSession, body: VoiceInterpretIn) -> VoiceInterpretOut:
    dishes = list((await db.execute(select(ThucDon).order_by(ThucDon.tenmon))).scalars().all())
    draft_quantities: dict[str, int] = {}
    for line in body.draft:
        draft_quantities[line.item_id] = draft_quantities.get(line.item_id, 0) + line.quantity

    # Resolve a pending allergy confirmation before interpreting another intent.
    pending = body.pending_draft_removal
    if pending:
        dish = next((item for item in dishes if item.id == pending.item_id), None)
        still_in_draft = pending.item_id in draft_quantities
        if dish and still_in_draft and _affirmative(body.transcript) and not _negative(
            body.transcript
        ):
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="order",
                remove_from_draft=[dish.id],
                message=f"Dạ, em đã xóa {dish.tenmon} khỏi giỏ hàng cho anh/chị rồi ạ.",
            )
        if _negative(body.transcript):
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="unknown",
                message=f"Dạ, em giữ món {dish.tenmon if dish else 'đã chọn'} trong giỏ hàng ạ.",
            )
        if dish and still_in_draft:
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="unknown",
                pending_draft_removal=pending,
                message=(
                    f"Dạ, món {dish.tenmon} trong giỏ hàng có chứa {pending.allergen} "
                    "mà anh/chị vừa báo dị ứng. Anh/chị có muốn em xóa món này "
                    "khỏi giỏ hàng không ạ?"
                ),
            )

    reported_allergies = _allergies_in(body.transcript)
    draft_dishes = [
        dish for dish in dishes
        if draft_quantities.get(dish.id, 0) > 0
    ]

    # ── Rule 1: Ghi chú bổ sung không kèm số lượng (Modifier-only next turn) ──
    # Nếu khách nói modifier-only (không kèm tên món rõ ràng) và lượt trước vừa thêm món
    requested_note_early = _note_for(body.transcript)
    if (
        requested_note_early
        and body.last_added_item_id
        and _is_modifier_only(body.transcript)
    ):
        last_dish = next((d for d in dishes if d.id == body.last_added_item_id), None)
        if last_dish and draft_quantities.get(last_dish.id, 0) > 0:
            existing_notes = [
                part.strip()
                for line in body.draft if line.item_id == last_dish.id
                for part in line.note.split(",") if part.strip()
            ]
            combined_note = ", ".join(
                dict.fromkeys(existing_notes + requested_note_early.split(", "))
            )
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="order",
                draft_note_updates=[VoiceDraftNoteUpdate(item_id=last_dish.id, note=combined_note)],
                message=f"Dạ, em đã cập nhật ghi chú {combined_note} cho món {last_dish.tenmon} ạ.",
            )

    for allergen in reported_allergies:
        affected = next(
            (dish for dish in draft_dishes if _dish_contains_allergen(dish, allergen)),
            None,
        )
        if affected:
            pending_removal = VoicePendingDraftRemoval(
                item_id=affected.id,
                allergen=allergen,
            )
            warning = VoiceWarning(
                item_id=affected.id,
                item_name=affected.tenmon,
                allergen=allergen,
                message=(
                    f"Dạ, món {affected.tenmon} trong giỏ hàng có chứa {allergen} "
                    "mà anh/chị vừa báo dị ứng. Anh/chị có muốn em xóa món này "
                    "khỏi giỏ hàng không ạ?"
                ),
            )
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="order",
                warnings=[warning],
                pending_draft_removal=pending_removal,
                message=warning.message,
            )

    normalized_transcript = normalize(body.transcript)
    draft_targets = _draft_dish_mentions(body.transcript, draft_dishes)
    if len(draft_targets) > 1 and any(
        phrase in normalized_transcript
        for phrase in ("bo bot", "tru bot", "giam", "chi giu lai", "giu lai", "xoa", "huy mon")
    ):
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="unknown",
            ambiguities=[VoiceAmbiguity(
                qty=1,
                candidates=[dish.id for dish in draft_targets],
                segment=body.transcript,
            )],
            message="Dạ, anh/chị muốn điều chỉnh món nào trong giỏ hàng ạ?",
        )

    decrease_request = any(phrase in normalized_transcript for phrase in (
        "bo bot", "tru bot", "giam bot", "giam xuong", "giam con",
        "chi giu lai", "giu lai", "de lai", "chi de lai",
        "chi con", "giam di",
    ))
    if draft_targets and decrease_request:
        dish = draft_targets[0]
        current_quantity = draft_quantities.get(dish.id, 0)
        number_pattern = r"(\d+|mot|hai|ba|bon|tu|nam|sau|bay|tam|chin|muoi)"
        absolute_match = re.search(
            rf"(?:chi giu lai|giu lai|giam xuong con|giam con|chi con"
            rf"|chi de lai|de lai)\s+{number_pattern}",
            normalized_transcript,
        )
        decrement_match = re.search(
            rf"(?:bo bot|tru bot|giam bot|giam di|giam)\s+{number_pattern}",
            normalized_transcript,
        )
        if absolute_match:
            new_quantity = _quantity_value(absolute_match.group(1)) or 0
        else:
            decrement = _quantity_value(decrement_match.group(1)) if decrement_match else 1
            new_quantity = max(current_quantity - (decrement or 1), 0)
        action = VoiceDraftChange(item_id=dish.id, quantity=new_quantity)
        if new_quantity:
            message = (
                f"Dạ, em đã giảm xuống còn {new_quantity} {dish.tenmon} "
                "trong giỏ hàng ạ."
            )
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="order",
                draft_changes=[action],
                message=message,
            )
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="order",
            remove_from_draft=[dish.id],
            message=f"Dạ, em đã xóa {dish.tenmon} khỏi giỏ hàng cho anh/chị ạ.",
        )

    if decrease_request and not draft_targets:
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="order",
            message="Dạ, em chưa tìm thấy món cần giảm trong giỏ hàng ạ.",
        )

    _remove_phrases = ("xoa", "huy mon", "huy", "bo mon", "bo di", "gium", "giup xoa", "xoa gium")
    hard_remove_request = not decrease_request and (
        any(phrase in normalized_transcript for phrase in _remove_phrases)
        or bool(re.search(r"bo .+ (khoi gio|ra khoi gio)", normalized_transcript))
        or bool(re.search(r"xoa .+ (gium|giup|cho|di)\b", normalized_transcript))
        or bool(re.search(r"huy mon (nay|do|nua)", normalized_transcript))
    )
    if hard_remove_request:
        if len(draft_targets) == 1:
            dish = draft_targets[0]
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="order",
                remove_from_draft=[dish.id],
                message=f"Dạ, em đã xóa {dish.tenmon} khỏi giỏ hàng cho anh/chị ạ.",
            )
        if not draft_targets:
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="order",
                message="Dạ, em chưa tìm thấy món đó trong giỏ hàng ạ.",
            )

    requested_note = _note_for(body.transcript)
    if requested_note and len(draft_targets) == 1:
        dish = draft_targets[0]
        existing_notes = [
            part.strip()
            for line in body.draft if line.item_id == dish.id
            for part in line.note.split(",") if part.strip()
        ]
        note = ", ".join(dict.fromkeys(existing_notes + requested_note.split(", ")))
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="order",
            draft_note_updates=[VoiceDraftNoteUpdate(item_id=dish.id, note=note)],
            message=f"Dạ, em đã ghi chú {note} cho món {dish.tenmon} ạ.",
        )

    # These broad menu questions use deterministic catalog matching; Gemini must
    # not conflate drinks with food that has soup, broth, or sauce.
    beverage_inquiry = _beverage_inquiry(body.transcript) and not _soup_inquiry(body.transcript)
    soup_inquiry = _soup_inquiry(body.transcript)
    if beverage_inquiry or soup_inquiry:
        if beverage_inquiry:
            matches = [
                dish for dish in dishes
                if normalize(dish.phanloai or "") in {"do uong", "khai vi"}
                and not dish.het_hang
            ]
            if matches:
                names = _friendly_candidates(matches[:5])
                message = (
                    f"Dạ, quán có các món đồ uống giải khát như {names}. "
                    "Anh/chị muốn dùng loại nào ạ?"
                )
            else:
                message = "Dạ, hiện quán chưa có món đồ uống hoặc khai vị phù hợp ạ."
        else:
            soup_terms = ("sup", "nuoc", "bun", "pho", "canh", "sot", "lau", "mi nuoc")
            matches = []
            for dish in dishes:
                category = normalize(dish.phanloai or "")
                if category not in {"mon chinh", "khai vi"} or dish.het_hang:
                    continue
                searchable = normalize(" ".join(filter(None, (
                    dish.tenmon, dish.mota, dish.thanhphan,
                ))))
                if any(term in searchable for term in soup_terms):
                    matches.append(dish)
            if matches:
                name = matches[0].tenmon
                message = (
                    f"Dạ, quán có món {name} có nước dùng rất đậm đà. "
                    "Anh/chị có muốn thử không ạ?"
                )
            else:
                message = "Dạ, em chưa tìm thấy món súp hoặc món ăn có nước dùng trong thực đơn ạ."
        recommendations = [_recommendation(dish) for dish in matches]
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="recommendation",
            recommendations=recommendations,
            suggestions=recommendations,
            message=message,
        )

    # ── Thử Gemini trước, fallback sang rule-based nếu không có key hoặc lỗi ──
    # Chỉ bỏ qua Gemini khi note đã được xử lý cho món TRONG giỏ bởi rule-based phía trên
    _note_handled_by_rules = requested_note and len(draft_targets) == 1
    gemini_data = None if _note_handled_by_rules else await _gemini_interpret(
        body.transcript, dishes, draft_quantities,
        draft_lines=body.draft,
        last_added_item_id=body.last_added_item_id,
    )
    if gemini_data is not None:
        result = _gemini_result_to_out(body.transcript, gemini_data, dishes)
        # Ghi log và trả về
        if body.table_name:
            session_result = await db.execute(
                select(PhienBan)
                .where(PhienBan.tenban == body.table_name, PhienBan.trangthai == "dang_phuc_vu")
                .order_by(PhienBan.giobatdau.desc().nullslast(), PhienBan.id.desc())
                .limit(1)
            )
            table_session = session_result.scalars().first()
            if table_session:
                db.add(LogGiongNoi(
                    phienban_id=table_session.id,
                    vanbangoc=body.transcript,
                    ydinhai=result.model_dump(mode="json"),
                ))
                await db.commit()
        return result

    # ── Rule-based fallback ──
    analysis_text = body.transcript
    normalized_text = normalize(analysis_text)
    if any(phrase in normalized_text for phrase in ("chon mon xong", "da chon xong", "xong roi")):
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="finish",
            done=True,
            message="Dạ, anh/chị kiểm tra lại đơn giúp em nhé ạ.",
        )

    adds: list[VoiceAdd] = []
    ambiguities: list[VoiceAmbiguity] = []
    out_of_stock: list[VoiceOos] = []
    not_found: list[str] = []
    suggestions: list[VoiceRecommendation] = []
    selected: list[ThucDon] = []
    stock_limits: list[VoiceStockLimit] = []
    reported_allergies = _allergies_in(body.transcript)

    for segment in _segments(analysis_text, dishes):
        quantity, item_text, qty_explicit = _quantity_and_text(segment)
        segment_normalized = normalize(item_text)
        if "di ung" in normalized_text and not _full_name_matches(item_text, dishes) and any(
            alias in segment_normalized
            for aliases in ALLERGY_TRIGGERS.values()
            for alias in aliases
        ):
            continue
        dish, candidates, is_search = _resolve_dish(item_text, dishes)
        if dish is None:
            if len(candidates) > 1:
                ambiguities.append(
                    VoiceAmbiguity(
                        qty=quantity,
                        candidates=[item.id for item in candidates],
                        segment=segment,
                    )
                )
            elif candidates and is_search:
                suggestions.extend(
                    VoiceRecommendation(id=item.id, name=item.tenmon, price=int(item.giaban))
                    for item in candidates
                )
            elif not candidates and "di ung" not in normalize(segment) and not any(
                phrase in normalize(segment) for phrase in ("goi y", "tu van", "nen an", "mon nao")
            ):
                not_found.append(segment)
            continue

        selected.append(dish)
        if dish.het_hang:
            alternatives = [item for item in dishes if item.id != dish.id and not item.het_hang][:3]
            out_of_stock.append(
                VoiceOos(id=dish.id, qty=quantity, suggestions=[item.id for item in alternatives])
            )
        elif is_search:
            suggestions.append(
                VoiceRecommendation(id=dish.id, name=dish.tenmon, price=int(dish.giaban))
            )
        else:
            # Rule 2: Hỏi lại số lượng nếu khách không nói rõ (chỉ apply khi có 1 món, không đa món)
            if not qty_explicit and len(_segments(analysis_text, dishes)) == 1:
                return VoiceInterpretOut(
                    transcript=body.transcript,
                    intent="unknown",
                    needs_quantity_for=VoiceNeedsQuantity(
                        item_id=dish.id, item_name=dish.tenmon
                    ),
                    message=f"Dạ, anh/chị muốn gọi mấy phần {dish.tenmon} ạ?",
                )
            # Số phần còn: mua sẵn theo soluongton, chế biến theo nguyên liệu
            if dish.so_phan_con is not None:
                available = max(dish.so_phan_con - draft_quantities.get(dish.id, 0), 0)
                if quantity > available:
                    stock_limits.append(VoiceStockLimit(
                        item_id=dish.id,
                        item_name=dish.tenmon,
                        requested=quantity,
                        available=available,
                    ))
                    continue
            adds.append(
                VoiceAdd(
                    id=dish.id,
                    name=dish.tenmon,
                    qty=quantity,
                    note=_note_for(segment),
                    price=int(dish.giaban),
                )
            )

    warnings: list[VoiceWarning] = []
    for dish in dict.fromkeys(selected):
        for allergen in reported_allergies:
            if _dish_contains_allergen(dish, allergen):
                warnings.append(
                    VoiceWarning(
                        item_id=dish.id,
                        item_name=dish.tenmon,
                        allergen=allergen,
                        message=(
                            f"Dạ, món {dish.tenmon} có chứa {allergen}, "
                            "anh/chị có muốn đổi sang món khác không ạ?"
                        ),
                    )
                )

    # ── Allergy-only: khách khai báo dị ứng nhưng chưa gọi món ──
    # Cảnh báo tất cả món trong menu có chứa thành phần bị dị ứng (Intent B)
    allergy_only_warnings: list[VoiceWarning] = []
    allergy_only = (
        reported_allergies
        and not adds and not ambiguities
        and not out_of_stock and not stock_limits
        and not suggestions and not warnings
    )
    if allergy_only:
        for dish in dishes:
            for allergen in reported_allergies:
                if _dish_contains_allergen(dish, allergen) and not dish.het_hang:
                    allergy_only_warnings.append(VoiceWarning(
                        item_id=dish.id,
                        item_name=dish.tenmon,
                        allergen=allergen,
                        message=(
                            f"Dạ, món {dish.tenmon} có chứa {allergen}, "
                            "anh/chị có muốn đổi sang món khác không ạ?"
                        ),
                    ))

    has_recommendation_intent = any(
        phrase in normalized_text
        for phrase in ("goi y", "tu van", "nen an", "mon nao")
    )
    # ── Keyword/ingredient search (Intent A): khách hỏi theo nguyên liệu/từ khóa ──
    # Mở rộng trigger để nhận "tôi muốn ăn cơm", "có món nào chứa thịt bò không"
    ingredient_triggers = (
        "co mon nao", "mon nao co", "co gi", "muon an", "muon uong",
        "thich an", "thich uong", "co chua", "chua",
    )
    has_ingredient_search = any(
        phrase in normalized_text for phrase in ingredient_triggers
    ) or has_recommendation_intent

    recommendations: list[VoiceRecommendation] = []
    if has_recommendation_intent:
        recommendations = [
            VoiceRecommendation(id=item.id, name=item.tenmon, price=int(item.giaban))
            for item in dishes
            if not item.het_hang
            and not any(
                _dish_contains_allergen(item, allergy) for allergy in reported_allergies
            )
        ][:3]

    # ── Xác định intent ──
    if adds or out_of_stock or ambiguities or stock_limits or not_found:
        intent = "order"
    elif allergy_only_warnings:
        intent = "order"   # trả về kèm warnings để frontend hiển thị cảnh báo
    elif suggestions or has_ingredient_search:
        intent = "recommendation"   # khớp spec Intent A
    elif has_recommendation_intent:
        intent = "recommendation"
    else:
        intent = "unknown"

    # ── Tổng hợp warnings ──
    all_warnings = warnings + allergy_only_warnings

    if all_warnings:
        message_parts = [all_warnings[0].message]
    else:
        message_parts = []

    if ambiguities:
        choices = _friendly_candidates(
            [dish for dish in dishes if dish.id in ambiguities[0].candidates]
        )
        message_parts.append(
            f"Dạ, nhà hàng có {choices}. Anh/chị muốn dùng món nào ạ?"
        )
    elif stock_limits:
        limit = stock_limits[0]
        message_parts.append(
            f"Dạ nhà hàng hiện chỉ còn {limit.available} phần {limit.item_name}, "
            f"anh/chị có muốn lấy {limit.available} phần không ạ?"
        )
    elif suggestions:
        # Intent A: "Dạ, quán có món [Tên]. Anh/chị có muốn dùng không ạ?"
        if len(suggestions) == 1:
            message_parts.append(
                f"Dạ, quán có món {suggestions[0].name}."
                " Anh/chị có muốn dùng không ạ?"
            )
        else:
            choices = _friendly_candidates(
                [dish for dish in dishes if any(s.id == dish.id for s in suggestions)]
            )
            message_parts.append(
                f"Dạ, quán có các món phù hợp gồm {choices}."
                " Anh/chị muốn dùng món nào ạ?"
            )
    elif adds:
        noted_adds = [item for item in adds if item.note]
        if len(adds) == 1 and len(noted_adds) == 1:
            message_parts.append(
                f"Dạ, em đã ghi chú {noted_adds[0].note} cho món {noted_adds[0].name} ạ."
            )
        else:
            confirmed = ", ".join(
                f"{item.qty} phần {item.name}"
                + (f", ghi chú {item.note}" if item.note else "")
                for item in adds
            )
            message_parts.append(
                f"Dạ, em đã ghi nhận {confirmed}. Anh/chị có muốn gọi thêm món nào nữa không ạ?"
            )
    elif out_of_stock:
        message_parts.append(
            "Dạ, món anh/chị chọn hiện đã hết hàng."
            " Anh/chị chọn món khác giúp em nhé ạ."
        )
    elif recommendations:
        message_parts.append(
            "Dạ, em gợi ý "
            + _friendly_candidates(
                [dish for dish in dishes if any(item.id == dish.id for item in recommendations)]
            )
            + ". Anh/chị muốn dùng món nào ạ?"
        )
    elif not_found:
        message_parts.append(
            f"Dạ, em chưa tìm thấy {', '.join(not_found)} trong thực đơn. "
            "Anh/chị cho em biết tên món khác nhé ạ."
        )
    else:
        message_parts.append("Dạ, anh/chị muốn dùng món nào ạ?")

    result = VoiceInterpretOut(
        transcript=body.transcript,
        intent=intent,
        adds=adds,
        ambiguities=ambiguities,
        oos=out_of_stock,
        stock_limits=stock_limits,
        not_found=not_found,
        warnings=all_warnings,   # gồm cả allergy_only_warnings
        recommendations=recommendations,
        suggestions=suggestions,
        message=" ".join(message_parts),
    )
    # Ghi transcript theo phiên để có thể xóa khi đóng bàn; không nhận/lưu file âm thanh.
    if body.table_name:
        session_result = await db.execute(
            select(PhienBan)
            .where(PhienBan.tenban == body.table_name, PhienBan.trangthai == "dang_phuc_vu")
            .order_by(PhienBan.giobatdau.desc().nullslast(), PhienBan.id.desc())
            .limit(1)
        )
        table_session = session_result.scalars().first()
        if table_session:
            db.add(LogGiongNoi(
                phienban_id=table_session.id,
                vanbangoc=body.transcript,
                ydinhai=result.model_dump(mode="json"),
            ))
            await db.commit()
    return result
