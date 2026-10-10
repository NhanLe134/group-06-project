import asyncio
import json
import logging
import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.menu import ThucDon
from app.models.order import Ban, PhieuBan
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

logger = logging.getLogger(__name__)

QUANTITIES = {
    "mot": 1,
    "hai": 2,
    "ba": 3,
    "bon": 4,
    "tu": 4,
    "nam": 5,
    "sau": 6,
    "bay": 7,
    "tam": 8,
    "chin": 9,
    "muoi": 10,
}
# Ánh xạ tên dị ứng → các từ khóa cần khớp trong allergens/ingredients/name/description.
# Hải sản = toàn bộ nhóm: tôm, cua, mực, cá, nghêu, sò, ốc, ghẹ, ngao, hào...
ALLERGEN_ALIASES: dict[str, tuple[str, ...]] = {
    "tôm": ("tom", "shrimp", "prawn"),
    "hành": ("hanh", "onion", "spring onion", "green onion", "shallot"),
    "hải sản": (
        "hai san",
        "seafood",
        "do bien",
        # tôm các loại
        "tom su",
        "tom the",
        "tom hum",
        "tom tit",
        "tom cang",
        "tom bien",
        "tom tuoi",
        # cua / ghẹ
        "cua bien",
        "ghe",
        "cua",
        # mực
        "muc",
        "muc ong",
        "muc nang",
        "squid",
        "calamari",
        # khác
        "shrimp",
        "prawn",
        "ngheu",
        "clam",
        "hao",
        "oyster",
        "ngao",
        "bao ngu",
        "abalone",
        "tom yum",
        "tomyum",
    ),
    "trứng": ("trung", "egg", "trung ga"),
    "đậu phộng": ("dau phong", "lac", "peanut"),
    "sữa": ("sua", "milk", "dairy", "lactose", "pho mai", "kem tuoi"),
    "gluten": ("gluten", "lua mi", "mi y", "banh mi", "bot mi"),
}
# ALLERGY_TRIGGERS — từ khóa nhận diện khai báo dị ứng trong transcript
ALLERGY_TRIGGERS: dict[str, tuple[str, ...]] = {
    "tôm": ("tom", "shrimp", "prawn"),
    "hành": ("hanh", "onion", "spring onion", "green onion", "shallot"),
    "hải sản": (
        "hai san",
        "seafood",
        "do bien",
        # khách có thể nói "dị ứng tôm / cua / mực" → map về nhóm hải sản
        "tom",
        "cua",
        "muc",
        "ghe",
        "ngheu",
        "ngao",
        "hao",
    ),
    "trứng": ("trung", "egg"),
    "đậu phộng": ("dau phong", "lac", "peanut"),
    "sữa": ("sua", "milk", "dairy", "lactose"),
    "gluten": ("gluten", "lua mi"),
}

# Nhóm tên món / cụm từ phổ biến chứa hải sản (compound match, dùng cho tên món)
ALLERGEN_NAME_GROUPS: dict[str, tuple[str, ...]] = {
    "hải sản": (
        "hai san",
        "seafood",
        "do bien",
        "tom yum",
        "tomyum",
        "lau tom",
        "lau cua",
        "lau hai san",
        "sup hai san",
        "mien hai san",
        "mi hai san",
        "com chien hai san",
    ),
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
    "toi",
    "minh",
    "muon",
    "an",
    "uong",
    "cho",
    "lay",
    "them",
    "goi",
    "y",
    "tu",
    "van",
    "nen",
    "giup",
    "tim",
    "voi",
    "mot",
    "phan",
    "suat",
    "ly",
    "chai",
    "coc",
    "bat",
    "dia",
    "mon",
    "do",
    "nha",
    "hang",
    "quan",
    "co",
    "nao",
    "gi",
    "di",
    "nhe",
    "a",
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
    remainder = cleaned[match.end() :]
    remainder = re.sub(r"^\s*(?:phần|suất|ly|chai|cốc|bát|đĩa)\s+", "", remainder, flags=re.IGNORECASE)
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
            dish
            for dish in dishes
            if "bo" in normalize(dish.tenmon) and any(token in normalize(dish.tenmon) for token in ("xao", "sot"))
        ]
        return (candidates[0] if len(candidates) == 1 else None), candidates, False

    query_tokens = query.split()
    if len(query_tokens) >= 2:
        named = [
            dish
            for dish in dishes
            if query in normalize(dish.tenmon)
            or set(query_tokens).issubset(set(re.findall(r"[a-z0-9]+", normalize(dish.tenmon))))
        ]
        if named:
            if len(named) == 1:
                return named[0], named, False
            return None, named, False

    return None, _keyword_matches(query, dishes), True


def _should_parse_order_deterministically(transcript: str, dishes: list[ThucDon]) -> bool:
    """Keep Gemini from dropping explicit multi-item orders or guessing ambiguity."""
    segments = _segments(transcript, dishes)
    parsed_segments = []
    for segment in segments:
        _, item_text, qty_explicit = _quantity_and_text(segment)
        dish, candidates, _ = _resolve_dish(item_text, dishes)
        parsed_segments.append((qty_explicit, dish, candidates))

    # An explicit quantity and multiple possible dishes must always trigger a
    # clarification question, even if Gemini would otherwise select one.
    if any(qty_explicit and len(candidates) > 1 for qty_explicit, _, candidates in parsed_segments):
        return True

    # For a joined order, use the parser when every portion has an explicit
    # quantity and at least one portion resolves against the menu.
    return (
        len(parsed_segments) > 1
        and all(qty_explicit for qty_explicit, _, _ in parsed_segments)
        and any(dish or candidates for _, dish, candidates in parsed_segments)
    )


def _allergies_in(transcript: str) -> list[str]:
    normalized = normalize(transcript)
    return [
        allergen
        for allergen, aliases in ALLERGY_TRIGGERS.items()
        if any(re.search(r"di ung(?: voi)?\s+(?:toi\s+)?" + re.escape(alias) + r"\b", normalized) for alias in aliases)
    ]


def _dish_contains_allergen(dish: ThucDon, allergen: str) -> bool:
    """Kiểm tra món có chứa thành phần dị ứng không.

    Dùng word-boundary matching (\ b) để tránh false-positive.
    Fail-safe: nếu dữ liệu allergens/ingredients trống → coi là KHÔNG AN TOÀN
    khi khách báo dị ứng (trả True để loại khỏi gợi ý).
    """
    aliases = ALLERGEN_ALIASES.get(allergen, (normalize(allergen),))

    def _word_match(alias: str, content: str) -> bool:
        """Khớp theo từ hoàn chỉnh để tránh 'so' khớp trong 'sot'."""
        return bool(re.search(r"(?<![a-z0-9])" + re.escape(alias) + r"(?![a-z0-9])", content))

    # Khớp theo name/description của món (vd. "Lẩu Thái Tomyum Hải Sản")
    name_content = normalize(" ".join(filter(None, (dish.tenmon, dish.mota))))
    if any(_word_match(alias, name_content) for alias in aliases):
        return True
    # Khớp theo tên nhóm phổ biến trong tên món
    name_groups = ALLERGEN_NAME_GROUPS.get(allergen, ())
    if any(_word_match(grp, name_content) for grp in name_groups):
        return True
    # Khớp theo thành phần (thanhphan) & thông tin dị ứng (thongtindiung)
    ingredient_content = normalize(" ".join(filter(None, (dish.thanhphan, dish.thongtindiung))))
    if ingredient_content and any(_word_match(alias, ingredient_content) for alias in aliases):
        return True
    # Fail-safe: không có dữ liệu thành phần/dị ứng → không an toàn khi có dị ứng
    if not ingredient_content:
        return True
    return False


def _dish_contains_ingredient(dish: ThucDon, ingredient_norm: str) -> bool:
    """Kiểm tra món có chứa nguyên liệu bị loại trừ (vd. hành) không.

    So khớp theo từ (word-boundary) sau khi normalize. Fail-safe tương tự.
    """
    content = normalize(" ".join(filter(None, (dish.thanhphan, dish.thongtindiung, dish.tenmon, dish.mota))))
    if not content:
        return False  # không rõ ingredient → không loại cứng, chỉ cảnh báo
    # Kiểm tra từng token của nguyên liệu cần loại
    tokens = re.findall(r"[a-z0-9]+", ingredient_norm)
    return all(t in re.findall(r"[a-z0-9]+", content) for t in tokens) if tokens else False


def _extract_ingredient_queries(transcript: str) -> tuple[list[str], str]:
    """Trích xuất các từ khóa nguyên liệu từ transcript khi người dùng hỏi về nguyên liệu/thành phần.
    Trả về (danh sách từ khóa để tìm kiếm, chuỗi hiển thị đẹp).
    """
    norm = normalize(transcript)

    # Loại trừ nếu là câu hỏi món nước / súp / lẩu
    if any(k in norm for k in ("mon co nuoc", "mon nao co nuoc", "muon mon co nuoc", "troi lanh")):
        return [], ""

    # Chỉ xử lý khi có tín hiệu hỏi nguyên liệu rõ ràng
    has_ingredient_intent = any(k in norm for k in ("chua", "co chua", "lam tu", "nguyen lieu", "thanh phan")) or bool(
        re.search(r"mon\s+(?:nao\s+)?co\s+", norm)
    )

    if not has_ingredient_intent:
        return [], ""

    skip_words = {
        "co",
        "chua",
        "mon",
        "nao",
        "nhung",
        "cac",
        "la",
        "a",
        "nhe",
        "vay",
        "thich",
        "an",
        "muon",
        "toi",
        "em",
        "quan",
        "khong",
        "mang",
        "dam",
        "ma",
        "thiet",
        "lam",
        "tu",
        "nguyen",
        "lieu",
        "thanh",
        "phan",
    }

    raw_clause = None
    # 1. Tìm cụm từ đứng sau 'chứa', 'có chứa', 'làm từ', 'thành phần'
    m_chua = re.search(r"(?:co\s+)?(?:chua|lam\s+tu|thanh\s+phan)\s+([a-z0-9\s,]+?)(?:\s+ma|\s+trong|\s*khong|$)", norm)
    if m_chua:
        raw_clause = m_chua.group(1).strip()
    else:
        # 2. Tìm cụm từ trong pattern 'món ... có <nguyên liệu>'
        m_co = re.search(r"mon\s+(?:nao\s+)?co\s+([a-z0-9\s,]+?)(?:\s*khong|$)", norm)
        if m_co:
            raw_clause = m_co.group(1).strip()

    if not raw_clause:
        return [], ""

    # Làm sạch các từ đệm ở đầu mệnh đề
    clause_tokens = raw_clause.split()
    while clause_tokens and clause_tokens[0] in skip_words:
        clause_tokens.pop(0)

    clean_clause = " ".join(clause_tokens).strip()
    if not clean_clause or clean_clause in {"nuoc", "nuoc dung", "nuoc leo", "sup", "mon nuoc", "thanh dam"}:
        return [], ""

    # Tách các nguyên liệu nối bằng "hoac", "va", ",", "hay"
    raw_parts = re.split(r"\bhoac\b|\bva\b|\bhay\b|,", clean_clause)
    query_terms = []
    for part in raw_parts:
        tokens = [t for t in part.split() if t not in skip_words]
        if tokens:
            term = " ".join(tokens)
            if term and term not in query_terms:
                query_terms.append(term)

    display_str = clean_clause
    orig_match = re.search(r"(?:chứa|có|làm từ)\s+([^.,!?]+)", transcript, re.IGNORECASE)
    if orig_match:
        display_str = re.sub(r"\s+(?:không|ạ|nhé|nha|vậy)\s*$", "", orig_match.group(1).strip(), flags=re.IGNORECASE)

    return query_terms, display_str


def _is_best_seller_question(transcript: str) -> bool:
    normalized = normalize(transcript)
    return any(
        term in normalized
        for term in (
            "best seller",
            "bestseller",
            "ban chay",
            "mon ban chay",
        )
    )


def _dish_matches_ingredient_search(dish: ThucDon, query: str) -> bool:
    aliases = {
        "tom": ("tom", "shrimp", "prawn"),
        "hai san": ("hai san", "seafood", "tom", "cua", "muc", "ghe", "ngheu", "ngao", "hao", "ca"),
        "seafood": ("hai san", "seafood", "tom", "cua", "muc", "ghe"),
        "bo": ("bo", "beef"),
        "thit bo": ("bo", "beef"),
        "ga": ("ga", "chicken"),
        "thit ga": ("ga", "chicken"),
        "ca": ("ca", "fish"),
        "muc": ("muc", "squid"),
        "cua": ("cua", "crab"),
        "hanh": ("hanh", "onion", "shallot"),
        "dau phong": ("dau phong", "peanut"),
        "trung": ("trung", "egg"),
        "nam": ("nam", "mushroom"),
    }
    terms = aliases.get(query, (query,))
    return any(_dish_contains_ingredient(dish, term) for term in terms)


class SmartIntent:
    """Kết quả trích xuất ý định có cấu trúc từ transcript."""

    def __init__(
        self,
        allergies: list[str],
        exclude_ingredients: list[str],
        prefer_spicy: bool | None,
        prefer_soup: bool | None,
        prefer_vegetarian: bool | None,
        prefer_dessert: bool | None = None,
        prefer_light: bool | None = None,
        budget_max: int | None = None,
    ) -> None:
        self.allergies = allergies  # ràng buộc cứng: dị ứng
        self.exclude_ingredients = exclude_ingredients  # ràng buộc cứng: không ăn X
        self.prefer_spicy = prefer_spicy  # ưu tiên mềm: thích cay (True) / không cay (False)
        self.prefer_soup = prefer_soup  # ưu tiên mềm: cần món có nước
        self.prefer_vegetarian = prefer_vegetarian  # ưu tiên mềm: ăn chay
        self.prefer_dessert = prefer_dessert  # món ngọt / tráng miệng
        self.prefer_light = prefer_light  # món thanh đạm / nhẹ bụng
        self.budget_max = budget_max


_SPICY_LEVELS_CAY = ("cay nhe", "cay vua", "cay nhieu", "cay")  # xếp theo mức tăng dần
_SOUP_KEYWORDS = ("sup", "lau", "canh", "bun", "pho", "mi nuoc", "chao")  # từ khoá trong tên/category


def _extract_smart_intent(transcript: str) -> SmartIntent:
    """Bước 1: Trích xuất ý định có cấu trúc từ transcript bằng rule-based."""
    norm = normalize(transcript)

    # ── Bước 1a: Dị ứng (RÀNG BUỘC CỨNG) ──
    allergies: list[str] = []
    if re.search(r"di ung", norm):
        for allergen, aliases in ALLERGY_TRIGGERS.items():
            if allergen in allergies:
                continue
            norm_allergen = normalize(allergen)
            if re.search(
                r"di ung(?:\s+voi)?\s+[^.]*?" + re.escape(norm_allergen) + r"(?![a-z0-9])",
                norm,
            ):
                allergies.append(allergen)
                continue
            for alias in aliases:
                if re.search(
                    r"di ung(?:\s+voi)?\s+[^.]*?" + re.escape(alias) + r"(?![a-z0-9])",
                    norm,
                ):
                    if allergen not in allergies:
                        allergies.append(allergen)
                    break

    # ── Bước 1b: Nguyên liệu bị loại trừ (RÀNG BUỘC CỨNG) ──
    exclude_ingredients: list[str] = []
    exclude_patterns = [
        r"khong thich\s+(?:an\s+)?([a-z0-9 ]+?)(?:\s+(?:nhung|va|ma)\s|\s*$)",
        r"khong an\s+([a-z0-9 ]+?)(?:\s+(?:nhung|va|ma)\s|\s*$)",
        r"khong muon\s+(?:an\s+)?([a-z0-9 ]+?)(?:\s+(?:nhung|va|ma)\s|\s*$)",
        r"dung cho\s+([a-z0-9 ]+?)(?:\s+(?:nhung|va|ma)\s|\s*$)",
        r"khong lay\s+([a-z0-9]+)",
        r"bo\s+(hanh|rau|da|ot|tieu|gung|xa|toi)(?:\s|$)",
    ]
    for pat in exclude_patterns:
        for m in re.finditer(pat, norm):
            raw = m.group(1).strip()
            tokens = [t for t in raw.split() if t not in FILLER_WORDS and len(t) > 1]
            if tokens:
                ingredient = " ".join(tokens)
                if ingredient not in exclude_ingredients:
                    exclude_ingredients.append(ingredient)

    # ── Bước 1c: Sở thích mềm & Khẩu vị ──
    prefer_spicy: bool | None = None
    if re.search(
        r"thich\s+(?:an\s+)?cay|\ban\s+cay\b|muon\s+(?:an\s+)?cay|\bcay\s+(?:nhieu|nhe|vua)|mon\s+(?:nao\s+)?cay|co\s+cay\s+khong",
        norm,
    ):
        prefer_spicy = True
    elif re.search(
        r"khong\s+(?:thich\s+|muon\s+)?(?:an\s+)?cay"
        r"|\bkhong\s+cay\b"
        r"|\bit\s+cay\b"
        r"|bi\s+nong"
        r"|khong\s+an\s+duoc\s+cay",
        norm,
    ):
        prefer_spicy = False

    prefer_soup: bool | None = None
    if re.search(
        r"(?:co\s+)?sup|(?:co\s+)?nuoc\s+dung|c[ao]nh|lau|pho"
        r"|bun\s+(?:bo|ga)|nuoc\.?\s+(?:leo|sup)"
        r"|mon\s+(?:nao\s+co\s+)?sup|sup\s+gi|mon\s+(?:nao\s+)?co\s+nuoc|troi\s+lanh",
        norm,
    ):
        prefer_soup = True

    prefer_vegetarian: bool | None = None
    if re.search(r"an\s+chay|mon\s+chay|diet\s+chay|chay\s+thuan", norm):
        prefer_vegetarian = True

    prefer_dessert: bool | None = None
    if re.search(r"trang\s+mieng|mon\s+ngot|do\s+trang\s+mieng", norm):
        prefer_dessert = True

    prefer_light: bool | None = None
    if re.search(r"thanh\s+dam|nhe\s+bung|thanh\s+nhe", norm):
        prefer_light = True

    return SmartIntent(
        allergies=allergies,
        exclude_ingredients=exclude_ingredients,
        prefer_spicy=prefer_spicy,
        prefer_soup=prefer_soup,
        prefer_vegetarian=prefer_vegetarian,
        prefer_dessert=prefer_dessert,
        prefer_light=prefer_light,
        budget_max=None,
    )


def _filter_dishes_for_recommendation(
    dishes: list[ThucDon],
    intent: SmartIntent,
) -> tuple[list[ThucDon], list[str]]:
    """Bước 2: Lọc món bằng CODE (deterministic).

    Trả về (danh sách món phù hợp đã xếp hạng, danh sách lý do loại trừ).
    """
    reasons: list[str] = []

    # a) Loại món hết hàng
    available = [d for d in dishes if not d.het_hang]

    # b) Loại cứng theo allergen (fail-safe)
    if intent.allergies:
        safe: list[ThucDon] = []
        for dish in available:
            is_unsafe = any(_dish_contains_allergen(dish, allergen) for allergen in intent.allergies)
            if not is_unsafe:
                safe.append(dish)
        allergen_removed = len(available) - len(safe)
        if allergen_removed:
            reasons.append(f"đã loại {allergen_removed} món chứa hoặc có thể chứa " + ", ".join(intent.allergies))
        available = safe

    # b2) Loại cứng theo exclude_ingredients
    if intent.exclude_ingredients:
        safe2: list[ThucDon] = []
        for dish in available:
            has_excluded = any(_dish_contains_ingredient(dish, normalize(ing)) for ing in intent.exclude_ingredients)
            if not has_excluded:
                safe2.append(dish)
        available = safe2

    # Case 1: Khẩu vị cay (prefer_spicy is True) -> CHỈ lấy món có độ cay trong DB
    if intent.prefer_spicy is True:
        spicy_dishes = []
        for dish in available:
            docay_norm = normalize(dish.docay or "")
            name_norm = normalize(dish.tenmon or "")
            mota_norm = normalize(dish.mota or "")
            is_spicy = (
                any(k in docay_norm for k in ("cay nhe", "cay vua", "cay nhieu", "cay"))
                or ("cay" in name_norm and "khong cay" not in name_norm)
                or ("cay" in mota_norm and "khong cay" not in mota_norm)
            )
            if is_spicy:
                spicy_dishes.append(dish)
        available = spicy_dishes
        if not available:
            reasons.append("quán hiện chưa có món cay trong thực đơn")

    # Case 2: Không ăn được cay (prefer_spicy is False) -> LOẠI HẾT món cay
    elif intent.prefer_spicy is False:
        non_spicy_dishes = []
        for dish in available:
            docay_norm = normalize(dish.docay or "")
            name_norm = normalize(dish.tenmon or "")
            mota_norm = normalize(dish.mota or "")
            is_spicy = (
                any(k in docay_norm for k in ("cay nhe", "cay vua", "cay nhieu", "cay"))
                or ("cay" in name_norm and "khong cay" not in name_norm)
                or ("cay" in mota_norm and "khong cay" not in mota_norm)
            )
            if not is_spicy:
                non_spicy_dishes.append(dish)
        available = non_spicy_dishes

    # Case 3: Món ngọt tráng miệng (prefer_dessert is True) -> CHỈ lấy món trong Tráng miệng
    if intent.prefer_dessert is True:
        dessert_dishes = []
        for dish in available:
            phanloai_norm = normalize(dish.phanloai or "")
            loaimon_norm = normalize(dish.loaimon or "")
            if (  # noqa: E501
                "trang mieng" in phanloai_norm
                or "trang mieng" in loaimon_norm
                or "ngot" in phanloai_norm
                or "ngot" in loaimon_norm
            ):
                dessert_dishes.append(dish)
        available = dessert_dishes
        if not available:
            reasons.append("quán hiện chưa có món tráng miệng trong thực đơn")

    # Case 4: Món thanh đạm, nhẹ bụng (prefer_light is True) -> Lọc theo dữ liệu thật trong DB
    if intent.prefer_light is True:
        light_dishes = []
        for dish in available:
            search_content = normalize(
                " ".join(filter(None, (dish.mota, dish.thanhphan, dish.loaimon, dish.tenmon, dish.phanloai)))
            )
            if any(k in search_content for k in ("thanh dam", "nhe bung", "thanh nhe")):
                light_dishes.append(dish)
        available = light_dishes
        if not available:
            reasons.append("chua_co_thong_tin_thanh_dam")

    # Case 5: Món có nước dùng (prefer_soup is True)
    if intent.prefer_soup is True:
        soup_dishes = []
        for dish in available:
            name_norm = normalize(" ".join(filter(None, (dish.tenmon, dish.phanloai, dish.mota, dish.thanhphan))))
            if any(k in name_norm for k in _SOUP_KEYWORDS):
                soup_dishes.append(dish)
        available = soup_dishes
        if not available:
            reasons.append("không có món súp/nước phù hợp")

    return available[:3], reasons


def _beverage_inquiry(text: str) -> bool:
    normalized = normalize(text)
    return any(
        term in normalized
        for term in (
            "nuoc uong",
            "giai khat",
            "do uong",
            "uong gi",
            "nuoc gi",
        )
    )


def _soup_inquiry(text: str) -> bool:
    normalized = normalize(text)
    return any(
        term in normalized
        for term in (
            "sup",
            "nuoc dung",
            "nuoc leo",
            "mon nao co nuoc",
            "mon co nuoc",
            "mon gi co nuoc",
            "co mon nuoc",
        )
    )


def _affirmative(text: str) -> bool:
    normalized = normalize(text)
    return any(
        term in normalized
        for term in (
            "xoa di",
            "bo di",
            "bo mon",
            "xoa mon",
            "xoa no",
            "duoc xoa",
            "hay xoa",
            "dung xoa",
            "ok xoa",
            "uh xoa",
            "u xoa",
            "vang xoa",
            "co xoa",
            "xoa giup",
        )
    ) or normalized.strip() in {"co", "vang", "duoc", "ok", "u", "uh", "roi"}


def _negative(text: str) -> bool:
    normalized = normalize(text)
    return any(
        term in normalized
        for term in (
            "khong xoa",
            "dung xoa",
            "giu lai",
            "de lai",
            "khong can",
        )
    )


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
        "khong hanh": "Không hành",
        "khong lay hanh": "Không hành",
        "bo hanh": "Không hành",
        "khong rau": "Không rau",
        "khong lay rau": "Không rau",
        "bo rau": "Không rau",
        "it cay": "Ít cay",
        "nhieu cay": "Nhiều cay",
        "khong da": "Không đá",
        "khong lay da": "Không đá",
        "it da": "Ít đá",
        "it ngot": "Ít ngọt",
        "chia doi phan": "Chia đôi phần",
        "khong ot": "Không ớt",
        "bo ot": "Không ớt",
        "khong tieu": "Không tiêu",
        "bo tieu": "Không tiêu",
        "them da": "Thêm đá",
        "them nuoc": "Thêm nước",
        "them tuong": "Thêm tương",
        "them ot": "Thêm ớt",
        "it hanh": "Ít hành",
        "it rau": "Ít rau",
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


def _friendly_candidates_with_price_and_reason(
    dishes: list[ThucDon],
    reason_fn=None,
) -> str:
    formatted = []
    for dish in dishes:
        reason = reason_fn(dish) if reason_fn else None
        price_str = f"{int(dish.giaban):,}".replace(",", ".") + "đ"
        if reason:
            formatted.append(f"{dish.tenmon} ({price_str} - {reason})")
        else:
            formatted.append(f"{dish.tenmon} ({price_str})")
    if not formatted:
        return ""
    if len(formatted) == 1:
        return formatted[0]
    if len(formatted) == 2:
        return f"{formatted[0]} và {formatted[1]}"
    return f"{', '.join(formatted[:-1])} và {formatted[-1]}"


def _build_gemini_system_prompt(
    dishes: list[ThucDon],
    draft_quantities: dict[str, int],
    draft_lines: list | None = None,
    last_added_item_id: str | None = None,
) -> str:
    """Tạo system prompt cho Gemini dựa trên dữ liệu menu thực tế từ DB.

    Chỉ đưa món CÒN BÁN vào menu block để giảm token và tránh hallucination.
    """
    menu_lines: list[str] = []
    for d in dishes:
        # Bỏ qua món hết hàng trong prompt — Gemini không cần biết về chúng
        if d.het_hang:
            continue

        stock = d.so_phan_con
        if stock is not None:
            draft_used = draft_quantities.get(d.id, 0)
            available = max(stock - draft_used, 0)
            stock_str = f"Tồn kho: {available}"
        else:
            stock_str = "Tồn kho: không giới hạn"

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
        if d.loaimon:
            parts_list.append(f"Loại: {d.loaimon}")
        if d.mota:
            parts_list.append(f"Mô tả: {d.mota}")
        menu_lines.append(f"- {d.tenmon} ({', '.join(parts_list)})")

    menu_block = "\n".join(menu_lines) if menu_lines else "(Không có món nào)"

    # Build current draft block
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

    if last_added_item_id:
        dish_map_tmp = {d.id: d for d in dishes}
        last_dish = dish_map_tmp.get(last_added_item_id)
        last_added_item_id_block = f"{last_dish.tenmon} (ID: {last_added_item_id})" if last_dish else last_added_item_id
    else:
        last_added_item_id_block = "(không có)"

    return f"""Bạn là trợ lý AI thân thiện của nhà hàng, chuyên nhận order và tư vấn món ăn.
Nhiệm vụ: phân tích transcript của khách, đối chiếu với dữ liệu menu thực tế bên dưới,
rồi trả về JSON thuần túy (không markdown, không giải thích thêm ngoài JSON).
Luôn xưng "em", gọi khách là "anh/chị", giọng lịch sự và ngắn gọn như nhân viên phục vụ.

═══ QUY TẮC BẮT BUỘC (VI PHẠM = SAI) ═══

QUY TẮC 1 — TRUNG THỰC VỀ THỰC ĐƠN:
  • Chỉ nhắc đến món có trong danh sách menu bên dưới.
  • Chỉ mô tả đặc điểm ghi rõ trong dữ liệu (thành phần, vị, loại).
  • TUYỆT ĐỐI không bịa thêm tính chất như "đậm đà", "có nước dùng", "thơm ngon"
    nếu không có trong trường "Mô tả" hoặc "Thành phần" của món đó.

QUY TẮC 2 — AN TOÀN DỊ ỨNG (ƯU TIÊN CAO NHẤT):
  • Khi khách khai báo dị ứng với nguyên liệu X:
    - Rà soát TOÀN BỘ menu (cả trường "Thành phần" lẫn "Dị ứng").
    - Trong field "message": liệt kê rõ tên từng món chứa X để khách tránh,
      ví dụ: "Em lưu ý anh/chị các món sau có chứa tôm: Bánh tráng tôm, Lẩu hải sản..."
    - TUYỆT ĐỐI không thêm món chứa X vào adds/recommendations/suggestions.
    - Nếu giỏ nháp đang có món chứa X: điền warnings + pending_draft_removal để hỏi khách xóa.
  • Nhóm hải sản bao gồm: tôm, cua, mực, ghẹ, nghêu, ngao, hào, bào ngư và mọi biến thể.
  • Nguyên tắc fail-safe: món KHÔNG CÓ dữ liệu thành phần/dị ứng → coi là KHÔNG AN TOÀN
    khi khách báo dị ứng (đưa vào warnings, không gợi ý).

QUY TẮC 3 — MÓN HẾT HÀNG / KHÔNG CÓ TRONG MENU:
  • Nếu khách gọi món có "Tồn kho: 0" hoặc món không tồn tại trong danh sách:
    - TUYỆT ĐỐI không nhận order món đó.
    - Phản hồi rõ: món đó "đã hết" hoặc "quán không có", điền vào trường "oos" hoặc "not_found".
    - Chủ động gợi ý 1–2 món tương tự còn hàng trong trường "suggestions" của oos
      (dựa vào cùng danh mục hoặc từ khoá tên món).

QUY TẮC 4 — TÊN MÓN MƠ HỒ (KHÔNG TỰ SUY ĐOÁN):
  • Nếu khách nói tên chung chung mà khớp với 2+ món trong menu (ví dụ: "cho 1 bò" khớp với
    "Bò sốt tiêu đen" và "Bò xào cần"), TUYỆT ĐỐI không tự chọn.
  • Phải hỏi lại ngay, điền ambiguities. Trong "message" liệt kê rõ các lựa chọn kèm giá,
    ví dụ: "Dạ quán có 'Bò sốt tiêu đen' (120.000đ) và 'Bò xào cần' (85.000đ).
    Anh/chị muốn dùng món nào ạ?"

QUY TẮC 5 — SỐ LƯỢNG:
  • Nếu khách không nói rõ số lượng VÀ không rõ từ ngữ cảnh → hỏi lại qua needs_quantity_for.
  • Nếu câu nói chỉ có 1 tên món, không kèm số → mặc định qty = 1 (KHÔNG hỏi lại).
  • Không tự tăng số lượng quá tồn kho; nếu vượt → báo stock_limits.

QUY TẮC 6 — GHI CHÚ:
  • Trích xuất ghi chú đúng từ câu nói và chuẩn hoá:
    "không hành" / "bỏ hành" → "Không hành"
    "ít cay" → "Ít cay" | "nhiều cay" → "Nhiều cay" | "không cay" → "Không cay"
    "không đá" / "bỏ đá" → "Không đá" | "ít đá" → "Ít đá" | "thêm đá" → "Thêm đá"
    "không rau" → "Không rau" | "ít ngọt" → "Ít ngọt" | "chia đôi phần" → "Chia đôi phần"

QUY TẮC 7 — KHÔNG TỰ GỬI BẾP (BR-01):
  • Chỉ cập nhật Order Draft. TUYỆT ĐỐI không set "done": true trừ khi khách nói
    "xong rồi", "đặt xong", "vậy thôi", "hết rồi", "confirm" hoặc tương đương.

QUY TẮC 8 — GỢI Ý MÓN THEO KHẨU VỊ & SỞ THÍCH:
  • Khi hỏi món cay ("quán có món nào cay không"): CHỈ gợi ý món có độ cay trong DB
    (trường "Vị" có ghi cay), kèm lý do và giá.
  • Khi khách không ăn được cay ("tôi không ăn được cay"): LOẠI HẾT toàn bộ món cay,
    gợi ý món khác kèm lý do và giá.
  • Khi hỏi món ngọt tráng miệng ("cho tôi món ngọt tráng miệng"): CHỈ gợi ý món thuộc
    phân loại "Tráng miệng".
  • Khi hỏi món thanh đạm, nhẹ bụng ("có món nào thanh đạm, nhẹ bụng không"): gợi ý theo
    dữ liệu thật (Mô tả/Thành phần), hỏi lại 1 câu nếu thiếu thông tin, TUYỆT ĐỐI không bịa "thanh đạm".
  • Khi hỏi món có nước, trời lạnh ("tôi muốn món có nước, trời lạnh"): gợi ý món có nước dùng;
    nếu các món nước đều hải sản và khách chưa nêu dị ứng thì gợi ý kèm cảnh báo hải sản.
  • Khi hỏi món bán chạy ("gợi ý món bán chạy của quán"): CHỈ nói "bán chạy" nếu có cờ/thống kê thật
    (nhãn Bán chạy trên menu), kết quả phải khớp nhãn đó.

═══ DỮ LIỆU MENU (chỉ món còn bán — đây là nguồn duy nhất, không dùng kiến thức ngoài) ═══
{menu_block}

═══ GIỎ NHÁP HIỆN TẠI ═══
current_draft_items: {current_draft_block}
last_added_item_id: {last_added_item_id_block}

═══ BẢNG XỬ LÝ INTENT ═══
| Tình huống                                        | intent         | Trường cần điền                   |
|---------------------------------------------------|----------------|-----------------------------------|
| Khách hỏi gợi ý / tư vấn / nói sở thích           | recommendation | recommendations, message          |
| Khai báo dị ứng khi giỏ có món chứa chất đó       | order          | warnings, pending_draft_removal   |
| Thêm món — tên + số lượng rõ ràng                 | order          | adds                              |
| Tên món mơ hồ khớp 2+ món                         | order          | ambiguities, message              |
| Món hết hàng hoặc không có trong menu            | order          | oos / not_found, suggestions      |
| Thiếu số lượng (câu 2+ món, không rõ qty)         | order          | needs_quantity_for                |
| Thêm/sửa ghi chú cho món trong giỏ               | order          | draft_note_updates                |
| Giảm số lượng món trong giỏ                       | order          | draft_changes                     |
| Xóa món khỏi giỏ                                  | order          | remove_from_draft                 |
| Ghi chú bổ sung (last_added_item_id ≠ ∅)          | order          | draft_note_updates                |
| Khách kết thúc ("xong rồi", "đặt xong", v.v.)     | finish         | done: true                        |
| Không rõ ý định                                   | unknown        | message hỏi lại                   |

═══ FORMAT OUTPUT (JSON thuần — không bọc markdown) ═══
{{
  "intent": "order|recommendation|finish|unknown",
  "done": false,
  "message": "Phản hồi tiếng Việt, xưng em/anh chị, ngắn gọn, thân thiện",
  "adds": [{{"id": "MON001", "name": "Tên món", "qty": 1, "note": "", "price": 75000}}],
  "needs_quantity_for": {{"item_id": "MON001", "item_name": "Tên món"}},
  "draft_note_updates": [{{"item_id": "MON001", "note": "Không hành"}}],
  "draft_changes": [{{"item_id": "MON001", "quantity": 2}}],
  "remove_from_draft": ["MON001"],
  "ambiguities": [{{"qty": 1, "candidates": ["MON001", "MON002"], "segment": "bò"}}],
  "oos": [{{"id": "MON999", "qty": 1, "suggestions": ["MON002", "MON003"]}}],
  "stock_limits": [{{"item_id": "MON001", "item_name": "Tên món", "requested": 5, "available": 2}}],
  "not_found": ["tên món khách nói"],
  "warnings": [{{"item_id": "MON001", "item_name": "Tên món", "allergen": "tôm", "message": "Món này có chứa tôm"}}],
  "pending_draft_removal": {{"item_ids": ["MON001"], "allergen": "tôm",
                           "message": "Giỏ có món chứa tôm, anh/chị có muốn em xóa không?"}},
  "recommendations": [{{"id": "MON002", "name": "Tên món", "price": 85000}}],
  "suggestions": [{{"id": "MON003", "name": "Tên món", "price": 90000}}]
}}

LƯU Ý QUAN TRỌNG:
• Tất cả mảng mặc định [] khi không dùng.
• needs_quantity_for và pending_draft_removal mặc định null khi không dùng.
• "message" LUÔN có nội dung — không để trống, không trả lời ngoài JSON.
• price trong adds phải lấy đúng từ trường "Giá" của món trong menu, không tự tính.
"""


async def _gemini_interpret(
    transcript: str,
    dishes: list[ThucDon],
    draft_quantities: dict[str, int],
    draft_lines: list | None = None,
    last_added_item_id: str | None = None,
) -> dict | None:
    """Gọi Gemini API để phân tích transcript.

    Chạy trong thread pool để không block event loop (Gemini SDK là sync).
    Trả None nếu không có key hoặc lỗi.
    """
    if not settings.effective_ai_key:
        return None

    system_prompt = _build_gemini_system_prompt(dishes, draft_quantities, draft_lines, last_added_item_id)

    def _call_sync() -> dict | None:
        try:
            from google import genai  # type: ignore[import]

            client = genai.Client(api_key=settings.effective_ai_key)
            model = settings.ai_model or "models/gemini-2.5-flash"
            logger.info("Gemini request: model=%s, transcript=%r", model, transcript[:120])
            response = client.models.generate_content(
                model=model,
                contents=transcript,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    max_output_tokens=2048,
                ),
            )
            raw = response.text.strip()
            logger.info("Gemini raw response (first 300 chars): %r", raw[:300])
            # Bóc JSON ra khỏi markdown code block nếu có
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            parsed = json.loads(raw)
            logger.info("Gemini parsed intent=%r", parsed.get("intent"))
            return parsed
        except Exception as exc:
            logger.warning("Gemini call failed (%s: %s) — falling back to rule-based", type(exc).__name__, exc)
            return None

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _call_sync)


def _gemini_result_to_out(
    transcript: str,
    data: dict,
    dishes: list[ThucDon],
    reported_allergies: list[str] | None = None,
) -> VoiceInterpretOut:
    """Chuyển dict JSON từ Gemini sang VoiceInterpretOut, validate an toàn.

    reported_allergies: danh sách dị ứng đã extract bằng rule-based (fail-safe filter).
    Dùng để double-check output của Gemini — loại món dị ứng ra khỏi recommendations/adds
    phòng trường hợp Gemini hallucinate.
    """
    dish_map = {d.id: d for d in dishes}
    allergies = reported_allergies or []

    def _is_safe(dish_id: str) -> bool:
        """True nếu món an toàn với dị ứng đã báo."""
        if not allergies:
            return True
        dish = dish_map.get(dish_id)
        if not dish:
            return True
        return not any(_dish_contains_allergen(dish, a) for a in allergies)

    # Draft management
    remove_from_draft: list[str] = [
        str(item_id) for item_id in (data.get("remove_from_draft") or []) if str(item_id) in dish_map
    ]
    draft_changes: list[VoiceDraftChange] = []
    for item in data.get("draft_changes") or []:
        iid = str(item.get("item_id", ""))
        if iid in dish_map:
            draft_changes.append(
                VoiceDraftChange(
                    item_id=iid,
                    quantity=max(int(item.get("quantity") or 0), 0),
                )
            )
    draft_note_updates: list[VoiceDraftNoteUpdate] = []
    for item in data.get("draft_note_updates") or []:
        iid = str(item.get("item_id", ""))
        if iid in dish_map:
            draft_note_updates.append(
                VoiceDraftNoteUpdate(
                    item_id=iid,
                    note=str(item.get("note") or ""),
                )
            )

    nqf_raw = data.get("needs_quantity_for")
    needs_quantity_for: VoiceNeedsQuantity | None = None
    if nqf_raw and isinstance(nqf_raw, dict):
        nqf_id = str(nqf_raw.get("item_id", ""))
        if nqf_id in dish_map:
            needs_quantity_for = VoiceNeedsQuantity(
                item_id=nqf_id,
                item_name=dish_map[nqf_id].tenmon,
            )

    # adds — lọc món dị ứng ra (safety net)
    adds: list[VoiceAdd] = []
    for item in data.get("adds") or []:
        dish = dish_map.get(str(item.get("id", "")))
        if dish and _is_safe(dish.id):
            adds.append(
                VoiceAdd(
                    id=dish.id,
                    name=dish.tenmon,
                    qty=max(int(item.get("qty") or 1), 1),
                    note=str(item.get("note") or ""),
                    price=int(dish.giaban),
                )
            )

    ambiguities: list[VoiceAmbiguity] = []
    for item in data.get("ambiguities") or []:
        cands = [str(c) for c in (item.get("candidates") or []) if str(c) in dish_map]
        if len(cands) >= 2:
            ambiguities.append(
                VoiceAmbiguity(
                    qty=max(int(item.get("qty") or 1), 1),
                    candidates=cands,
                    segment=str(item.get("segment") or ""),
                )
            )

    oos: list[VoiceOos] = []
    for item in data.get("oos") or []:
        if str(item.get("id", "")) in dish_map:
            oos.append(
                VoiceOos(
                    id=str(item["id"]),
                    qty=max(int(item.get("qty") or 1), 1),
                    suggestions=[str(s) for s in (item.get("suggestions") or []) if str(s) in dish_map],
                )
            )

    stock_limits: list[VoiceStockLimit] = []
    for item in data.get("stock_limits") or []:
        if str(item.get("item_id", "")) in dish_map:
            stock_limits.append(
                VoiceStockLimit(
                    item_id=str(item["item_id"]),
                    item_name=str(item.get("item_name") or dish_map[item["item_id"]].tenmon),
                    requested=max(int(item.get("requested") or 1), 1),
                    available=max(int(item.get("available") or 0), 0),
                )
            )

    warnings: list[VoiceWarning] = []
    for item in data.get("warnings") or []:
        if str(item.get("item_id", "")) in dish_map:
            warnings.append(
                VoiceWarning(
                    item_id=str(item["item_id"]),
                    item_name=str(item.get("item_name") or ""),
                    allergen=str(item.get("allergen") or ""),
                    message=str(item.get("message") or ""),
                )
            )

    # pending_draft_removal từ Gemini — hỗ trợ cả 2 format:
    # - format cũ: {"item_id": "MON001", "allergen": "..."}
    # - format mới: {"item_ids": ["MON001", ...], "allergen": "...", "message": "..."}
    pdr_raw = data.get("pending_draft_removal")
    pending_draft_removal: VoicePendingDraftRemoval | None = None
    if pdr_raw and isinstance(pdr_raw, dict):
        # Thử item_ids (array) trước, fallback sang item_id (string)
        item_ids_raw = pdr_raw.get("item_ids") or []
        pdr_id = str(item_ids_raw[0]) if item_ids_raw else str(pdr_raw.get("item_id", ""))
        if pdr_id in dish_map:
            pending_draft_removal = VoicePendingDraftRemoval(
                item_id=pdr_id,
                allergen=str(pdr_raw.get("allergen", "")),
            )

    def _to_recs(raw: list | None) -> list[VoiceRecommendation]:
        result = []
        seen: set[str] = set()
        for item in raw or []:
            dish = dish_map.get(str(item.get("id", "")))
            # Double-check: loại món dị ứng khỏi gợi ý (safety net)
            if dish and dish.id not in seen and _is_safe(dish.id):
                result.append(
                    VoiceRecommendation(
                        id=dish.id,
                        name=dish.tenmon,
                        price=int(dish.giaban),
                    )
                )
                seen.add(dish.id)
        return result[:3]  # tối đa 3 chip

    intent_raw = str(data.get("intent") or "unknown")
    valid_intents = {
        "order",
        "suggestion",
        "recommendation",
        "ingredient_search",
        "finish",
        "unknown",
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
        pending_draft_removal=pending_draft_removal,
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
        if dish and still_in_draft and _affirmative(body.transcript) and not _negative(body.transcript):
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
    draft_dishes = [dish for dish in dishes if draft_quantities.get(dish.id, 0) > 0]

    # ── Rule 1: Ghi chú bổ sung không kèm số lượng (Modifier-only next turn) ──
    # Nếu khách nói modifier-only (không kèm tên món rõ ràng) và lượt trước vừa thêm món
    requested_note_early = _note_for(body.transcript)
    if requested_note_early and body.last_added_item_id and _is_modifier_only(body.transcript):
        last_dish = next((d for d in dishes if d.id == body.last_added_item_id), None)
        if last_dish and draft_quantities.get(last_dish.id, 0) > 0:
            existing_notes = [
                part.strip()
                for line in body.draft
                if line.item_id == last_dish.id
                for part in line.note.split(",")
                if part.strip()
            ]
            combined_note = ", ".join(dict.fromkeys(existing_notes + requested_note_early.split(", ")))
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
            ambiguities=[
                VoiceAmbiguity(
                    qty=1,
                    candidates=[dish.id for dish in draft_targets],
                    segment=body.transcript,
                )
            ],
            message="Dạ, anh/chị muốn điều chỉnh món nào trong giỏ hàng ạ?",
        )

    decrease_request = any(
        phrase in normalized_transcript
        for phrase in (
            "bo bot",
            "tru bot",
            "giam bot",
            "giam xuong",
            "giam con",
            "chi giu lai",
            "giu lai",
            "de lai",
            "chi de lai",
            "chi con",
            "giam di",
        )
    )
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
            message = f"Dạ, em đã giảm xuống còn {new_quantity} {dish.tenmon} trong giỏ hàng ạ."
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
            for line in body.draft
            if line.item_id == dish.id
            for part in line.note.split(",")
            if part.strip()
        ]
        note = ", ".join(dict.fromkeys(existing_notes + requested_note.split(", ")))
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="order",
            draft_note_updates=[VoiceDraftNoteUpdate(item_id=dish.id, note=note)],
            message=f"Dạ, em đã ghi chú {note} cho món {dish.tenmon} ạ.",
        )

    # ── Gợi ý thông minh: trích xuất ý định có cấu trúc + lọc deterministic ──
    # Kích hoạt khi khách hỏi gợi ý (beverage, soup, spicy, allergy + preference...)
    beverage_inquiry = _beverage_inquiry(body.transcript) and not _soup_inquiry(body.transcript)
    soup_inquiry = _soup_inquiry(body.transcript)
    normalized_request = normalize(body.transcript)
    smart_intent = _extract_smart_intent(body.transcript)
    ingredient_terms, ingredient_display = _extract_ingredient_queries(body.transcript)

    # Explicit ingredient questions should search the actual menu fields, not return
    # the generic first three dishes as recommendations.
    if ingredient_terms:
        matches = [
            dish
            for dish in dishes
            if not dish.het_hang
            and any(_dish_matches_ingredient_search(dish, term) for term in ingredient_terms)
            and not any(_dish_contains_allergen(dish, allergy) for allergy in smart_intent.allergies)
        ]
        if smart_intent.prefer_light:
            matches.sort(
                key=lambda d: any(
                    k in normalize(" ".join(filter(None, (d.mota, d.thanhphan, d.tenmon))))
                    for k in ("thanh dam", "nhe bung")
                ),
                reverse=True,
            )
        recommendations = [_recommendation(dish) for dish in matches[:3]]
        if matches:
            formatted = _friendly_candidates_with_price_and_reason(matches[:3])
            message = f"Dạ, quán có các món chứa {ingredient_display} như: {formatted}. Anh/chị muốn dùng món nào ạ?"
        else:
            message = f"Dạ, em chưa tìm thấy món còn bán có thông tin chứa {ingredient_display} trong thực đơn ạ."
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="ingredient_search",
            recommendations=recommendations,
            message=message,
        )

    # The menu already stores the staff-maintained bestseller flag. Use it directly.
    if _is_best_seller_question(body.transcript):
        matches = [
            dish
            for dish in dishes
            if dish.banchay is True
            and not dish.het_hang
            and not any(_dish_contains_allergen(dish, allergy) for allergy in smart_intent.allergies)
        ]
        recommendations = [_recommendation(dish) for dish in matches[:3]]
        if matches:

            def _banchay_reason(d: ThucDon) -> str:
                return "món bán chạy"

            formatted = _friendly_candidates_with_price_and_reason(matches[:3], _banchay_reason)
            message = (
                "Dạ, các món bán chạy của quán (khớp nhãn Bán chạy trên menu) "
                f"hiện còn phục vụ gồm: {formatted}. Anh/chị muốn dùng món nào ạ?"
            )
        elif smart_intent.allergies:
            message = "Dạ, hiện em chưa tìm thấy món bán chạy nào có thể xác nhận an toàn với dị ứng đã báo ạ."
        else:
            message = "Dạ, hiện thực đơn chưa có món nào được đánh dấu bán chạy ạ."
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="recommendation",
            recommendations=recommendations,
            message=message,
        )

    # Handle a standalone allergy disclosure deterministically, even when Gemini
    # is configured. Unknown ingredient data remains excluded from recommendations.
    if smart_intent.allergies and not any(
        (
            smart_intent.prefer_spicy is not None,
            smart_intent.prefer_soup is not None,
            smart_intent.prefer_vegetarian is not None,
            smart_intent.prefer_dessert is not None,
            smart_intent.prefer_light is not None,
            smart_intent.exclude_ingredients,
        )
    ):
        unsafe = [
            dish
            for dish in dishes
            if not dish.het_hang and any(_dish_contains_allergen(dish, allergy) for allergy in smart_intent.allergies)
        ]
        safe, _ = _filter_dishes_for_recommendation(dishes, smart_intent)
        warnings = [
            VoiceWarning(
                item_id=dish.id,
                item_name=dish.tenmon,
                allergen=", ".join(smart_intent.allergies),
                message=(
                    f"Dạ, {dish.tenmon} có chứa hoặc chưa xác nhận an toàn với {', '.join(smart_intent.allergies)}."
                ),
            )
            for dish in unsafe
        ]
        unsafe_names = _friendly_candidates(unsafe[:8]) if unsafe else ""
        safe_names = _friendly_candidates_with_price_and_reason(safe[:3]) if safe else ""
        message = f"Dạ, em đã ghi nhận anh/chị dị ứng {', '.join(smart_intent.allergies)}. "
        if unsafe_names:
            message += f"Các món cần tránh hoặc chưa xác nhận an toàn gồm {unsafe_names}. "
        if safe_names:
            message += f"Em gợi ý các món đã lọc: {safe_names}. Anh/chị muốn dùng món nào ạ?"
        else:
            message += "Hiện em chưa thể xác nhận món nào an toàn từ thông tin thành phần trong thực đơn ạ."
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="recommendation",
            recommendations=[_recommendation(dish) for dish in safe],
            warnings=warnings,
            message=message,
        )

    is_recommendation_request = (
        beverage_inquiry
        or soup_inquiry
        or any(
            phrase in normalized_request
            for phrase in (
                "goi y",
                "tu van",
                "nen an",
                "mon nao",
                "thich cay",
                "muon an cay",
                "di ung",
                "khong thich an",
                "khong an",
                "an chay",
                "co sup",
                "trang mieng",
                "mon ngot",
                "thanh dam",
                "nhe bung",
                "cay khong",
            )
        )
    )
    if is_recommendation_request:
        if beverage_inquiry:
            matches = [
                dish
                for dish in dishes
                if normalize(dish.phanloai or "") in {"do uong", "khai vi"} and not dish.het_hang
            ]
            if matches:
                names = _friendly_candidates_with_price_and_reason(matches[:5])
                message = f"Dạ, quán có các món đồ uống giải khát như {names}. Anh/chị muốn dùng loại nào ạ?"
            else:
                message = "Dạ, hiện quán chưa có món đồ uống hoặc khai vị phù hợp ạ."
            recommendations = [_recommendation(dish) for dish in matches[:3]]
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                message=message,
            )

        # Lọc deterministic theo dị ứng + sở thích
        filtered_dishes, filter_reasons = _filter_dishes_for_recommendation(dishes, smart_intent)

        # Case 1: Khẩu vị cay
        if smart_intent.prefer_spicy is True:
            if filtered_dishes:

                def _spicy_reason(d: ThucDon) -> str:
                    return f"độ cay: {d.docay}" if d.docay else "món cay"

                formatted = _friendly_candidates_with_price_and_reason(filtered_dishes, _spicy_reason)
                message = f"Dạ, quán có các món cay trong thực đơn gồm: {formatted}. Anh/chị muốn dùng món nào ạ?"
                recommendations = [_recommendation(dish) for dish in filtered_dishes]
            else:
                message = "Dạ, hiện thực đơn của quán chưa có món nào có độ cay ạ."
                recommendations = []
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                message=message,
            )

        # Case 2: Không ăn được cay
        if smart_intent.prefer_spicy is False:
            if filtered_dishes:

                def _non_spicy_reason(d: ThucDon) -> str:
                    return "không cay, dễ ăn"

                formatted = _friendly_candidates_with_price_and_reason(filtered_dishes, _non_spicy_reason)
                message = (
                    "Dạ, em đã loại toàn bộ món cay. Gợi ý các món không cay cho anh/chị: "
                    f"{formatted}. Anh/chị muốn dùng món nào ạ?"
                )
                recommendations = [_recommendation(dish) for dish in filtered_dishes]
            else:
                message = "Dạ, hiện thực đơn của quán không còn món nào phù hợp ạ."
                recommendations = []
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                message=message,
            )

        # Case 3: Món ngọt tráng miệng
        if smart_intent.prefer_dessert is True:
            if filtered_dishes:

                def _dessert_reason(d: ThucDon) -> str:
                    return "tráng miệng"

                formatted = _friendly_candidates_with_price_and_reason(filtered_dishes, _dessert_reason)
                message = f"Dạ, quán có các món ngọt trong Tráng miệng gồm: {formatted}. Anh/chị muốn dùng món nào ạ?"
                recommendations = [_recommendation(dish) for dish in filtered_dishes]
            else:
                message = "Dạ, hiện thực đơn của quán chưa có món tráng miệng phù hợp ạ."
                recommendations = []
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                message=message,
            )

        # Case 4: Món thanh đạm, nhẹ bụng
        if smart_intent.prefer_light is True:
            if filtered_dishes:

                def _light_reason(d: ThucDon) -> str:
                    return "thanh đạm, nhẹ bụng"

                formatted = _friendly_candidates_with_price_and_reason(filtered_dishes, _light_reason)
                message = (
                    "Dạ, các món thanh đạm, nhẹ bụng theo dữ liệu thực đơn gồm: "
                    f"{formatted}. Anh/chị muốn dùng món nào ạ?"
                )
                recommendations = [_recommendation(dish) for dish in filtered_dishes]
            else:
                message = "Dạ, trong thực đơn hiện chưa có thông tin đánh dấu món 'thanh đạm'. Anh/chị có muốn em gợi ý món súp nhẹ hay món chay không ạ?"  # noqa: E501
                recommendations = []
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                message=message,
            )

        # Case 5: Món có nước dùng (trời lạnh)
        if smart_intent.prefer_soup is True:
            if filtered_dishes:
                all_seafood = all(_dish_contains_allergen(d, "hải sản") for d in filtered_dishes)
                has_seafood_allergy = "hải sản" in smart_intent.allergies
                formatted = _friendly_candidates_with_price_and_reason(filtered_dishes)
                warnings = []
                if all_seafood and not has_seafood_allergy:
                    message = (
                        f"Dạ, với thời tiết lạnh em gợi ý các món nước dùng nóng hổi: {formatted}. "
                        "Lưu ý: các món nước hiện có chứa hải sản, anh/chị lưu ý nếu có dị ứng nhé ạ. "
                        "Anh/chị muốn dùng món nào ạ?"
                    )
                    warnings = [
                        VoiceWarning(
                            item_id=d.id,
                            item_name=d.tenmon,
                            allergen="hải sản",
                            message=f"Món {d.tenmon} có chứa hải sản",
                        )
                        for d in filtered_dishes
                    ]
                else:
                    message = (
                        "Dạ, với thời tiết lạnh em gợi ý các món nước dùng nóng hổi: "
                        f"{formatted}. Anh/chị muốn dùng món nào ạ?"
                    )
                recommendations = [_recommendation(dish) for dish in filtered_dishes]
            else:
                message = "Dạ, hiện thực đơn của quán chưa có món súp hoặc nước dùng phù hợp ạ."
                recommendations = []
                warnings = []
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                warnings=warnings,
                message=message,
            )

        # Trường hợp không có món nào thỏa điều kiện khác
        if not filtered_dishes:
            reason_str = "; ".join(filter_reasons) if filter_reasons else "không có món phù hợp"
            alt_intent = SmartIntent(
                allergies=smart_intent.allergies,
                exclude_ingredients=smart_intent.exclude_ingredients,
                prefer_spicy=None,
                prefer_soup=None,
                prefer_vegetarian=None,
                budget_max=None,
            )
            alt_dishes, _ = _filter_dishes_for_recommendation(dishes, alt_intent)
            if alt_dishes:
                alt_names = _friendly_candidates_with_price_and_reason(alt_dishes)
                allergy_note = ""
                if smart_intent.allergies:
                    allergy_note = (
                        "Hiện các món súp/lẩu của quán đều có "
                        + " hoặc ".join(smart_intent.allergies)
                        + " nên em không thể gợi ý cho anh/chị. "
                    )
                message = (
                    f"Dạ, {allergy_note}"
                    f"Tuy nhiên, em có thể gợi ý các món thay thế phù hợp với anh/chị: {alt_names}. "
                    "Các món này không chứa thành phần dị ứng đã báo. Anh/chị muốn thử không ạ?"
                )
                recommendations = [_recommendation(dish) for dish in alt_dishes]
            else:
                message = (
                    "Dạ, rất tiếc là hiện thực đơn quán không có món nào thỏa mãn tất cả yêu cầu "
                    f"của anh/chị ({reason_str}). Anh/chị có thể điều chỉnh yêu cầu để em tìm lại không ạ?"
                )
                recommendations = []
            return VoiceInterpretOut(
                transcript=body.transcript,
                intent="recommendation",
                recommendations=recommendations,
                message=message,
            )

        names = _friendly_candidates_with_price_and_reason(filtered_dishes)
        allergy_confirm = ""
        if smart_intent.allergies:
            allergy_confirm = " (em đã loại tất cả món chứa " + ", ".join(smart_intent.allergies) + ")"
        exclude_confirm = ""
        if smart_intent.exclude_ingredients:
            exclude_confirm = " và không có " + ", ".join(smart_intent.exclude_ingredients)
        message = f"Dạ, em gợi ý{allergy_confirm}{exclude_confirm}: {names}. Anh/chị muốn thử món nào ạ?"
        recommendations = [_recommendation(dish) for dish in filtered_dishes]
        return VoiceInterpretOut(
            transcript=body.transcript,
            intent="recommendation",
            recommendations=recommendations,
            message=message,
        )

    # ── Thử Gemini trước, fallback sang rule-based nếu không có key hoặc lỗi ──
    # Chỉ bỏ qua Gemini khi note đã được xử lý cho món TRONG giỏ bởi rule-based phía trên
    _note_handled_by_rules = requested_note and len(draft_targets) == 1
    deterministic_order = _should_parse_order_deterministically(body.transcript, dishes)
    if _note_handled_by_rules:
        logger.debug("Skipping Gemini — note already handled by rules for draft item")
    elif deterministic_order:
        logger.info("Skipping Gemini — explicit multi-item or ambiguous order parsed by rules")
    elif not settings.effective_ai_key:
        logger.warning("Gemini skipped — no AI key configured (AI_API_KEY / GEMINI_API_KEY)")
    gemini_data = (
        None
        if (_note_handled_by_rules or deterministic_order)
        else await _gemini_interpret(
            body.transcript,
            dishes,
            draft_quantities,
            draft_lines=body.draft,
            last_added_item_id=body.last_added_item_id,
        )
    )
    if gemini_data is not None:
        result = _gemini_result_to_out(body.transcript, gemini_data, dishes, reported_allergies)
        # Ghi log và trả về
        if body.table_name:
            ban_result = await db.execute(select(Ban).where(Ban.tenban == body.table_name).limit(1))
            ban = ban_result.scalars().first()
            if ban:
                phieu_result = await db.execute(
                    select(PhieuBan)
                    .where(PhieuBan.ban_id == ban.ban_id, PhieuBan.hoadon_id.is_(None))
                    .order_by(PhieuBan.giogoimon.desc(), PhieuBan.phieuban_id.desc())
                    .limit(1)
                )
                phieu = phieu_result.scalars().first()
            else:
                phieu = None
            if phieu:
                db.add(
                    LogGiongNoi(
                        phieuban_id=phieu.phieuban_id,
                        vanbangoc=body.transcript,
                        ydinhai=result.model_dump(mode="json"),
                    )
                )
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
        if (
            "di ung" in normalized_text
            and not _full_name_matches(item_text, dishes)
            and any(alias in segment_normalized for aliases in ALLERGY_TRIGGERS.values() for alias in aliases)
        ):
            continue
        dish, candidates, is_search = _resolve_dish(item_text, dishes)
        # A single menu match plus an explicit quantity is an order, even when
        # the customer used a shorthand such as "1 coca" for "Coca-Cola".
        if dish is None and len(candidates) == 1 and qty_explicit:
            dish, is_search = candidates[0], False
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
                    VoiceRecommendation(id=item.id, name=item.tenmon, price=int(item.giaban)) for item in candidates
                )
            elif (
                not candidates
                and "di ung" not in normalize(segment)
                and not any(phrase in normalize(segment) for phrase in ("goi y", "tu van", "nen an", "mon nao"))
            ):
                not_found.append(segment)
            continue

        selected.append(dish)
        if dish.het_hang:
            alternatives = [item for item in dishes if item.id != dish.id and not item.het_hang][:3]
            out_of_stock.append(VoiceOos(id=dish.id, qty=quantity, suggestions=[item.id for item in alternatives]))
        elif is_search:
            suggestions.append(VoiceRecommendation(id=dish.id, name=dish.tenmon, price=int(dish.giaban)))
        else:
            # Rule 2: Hỏi lại số lượng nếu khách không nói rõ (chỉ apply khi có 1 món, không đa món)
            if not qty_explicit and len(_segments(analysis_text, dishes)) == 1:
                return VoiceInterpretOut(
                    transcript=body.transcript,
                    intent="unknown",
                    needs_quantity_for=VoiceNeedsQuantity(item_id=dish.id, item_name=dish.tenmon),
                    message=f"Dạ, anh/chị muốn gọi mấy phần {dish.tenmon} ạ?",
                )
            # Số phần còn: mua sẵn theo soluongton, chế biến theo nguyên liệu
            if dish.so_phan_con is not None:
                available = max(dish.so_phan_con - draft_quantities.get(dish.id, 0), 0)
                if quantity > available:
                    stock_limits.append(
                        VoiceStockLimit(
                            item_id=dish.id,
                            item_name=dish.tenmon,
                            requested=quantity,
                            available=available,
                        )
                    )
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
                            f"Dạ, món {dish.tenmon} có chứa {allergen}, anh/chị có muốn đổi sang món khác không ạ?"
                        ),
                    )
                )

    # ── Allergy-only: khách khai báo dị ứng nhưng chưa gọi món ──
    # Cảnh báo tất cả món trong menu có chứa thành phần bị dị ứng (Intent B)
    allergy_only_warnings: list[VoiceWarning] = []
    allergy_only = (
        reported_allergies
        and not adds
        and not ambiguities
        and not out_of_stock
        and not stock_limits
        and not suggestions
        and not warnings
    )
    if allergy_only:
        for dish in dishes:
            for allergen in reported_allergies:
                if _dish_contains_allergen(dish, allergen) and not dish.het_hang:
                    allergy_only_warnings.append(
                        VoiceWarning(
                            item_id=dish.id,
                            item_name=dish.tenmon,
                            allergen=allergen,
                            message=(
                                f"Dạ, món {dish.tenmon} có chứa {allergen}, anh/chị có muốn đổi sang món khác không ạ?"
                            ),
                        )
                    )

    has_recommendation_intent = any(phrase in normalized_text for phrase in ("goi y", "tu van", "nen an", "mon nao"))
    # ── Keyword/ingredient search (Intent A): khách hỏi theo nguyên liệu/từ khóa ──
    # Mở rộng trigger để nhận "tôi muốn ăn cơm", "có món nào chứa thịt bò không"
    ingredient_triggers = (
        "co mon nao",
        "mon nao co",
        "co gi",
        "muon an",
        "muon uong",
        "thich an",
        "thich uong",
        "co chua",
        "chua",
    )
    has_ingredient_search = (
        any(phrase in normalized_text for phrase in ingredient_triggers) or has_recommendation_intent
    )

    recommendations: list[VoiceRecommendation] = []
    if has_recommendation_intent:
        recommendations = [
            VoiceRecommendation(id=item.id, name=item.tenmon, price=int(item.giaban))
            for item in dishes
            if not item.het_hang and not any(_dish_contains_allergen(item, allergy) for allergy in reported_allergies)
        ][:3]

    # ── Xác định intent ──
    if adds or out_of_stock or ambiguities or stock_limits or not_found:
        intent = "order"
    elif allergy_only_warnings:
        intent = "order"  # trả về kèm warnings để frontend hiển thị cảnh báo
    elif suggestions or has_ingredient_search:
        intent = "recommendation"  # khớp spec Intent A
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
        choices = _friendly_candidates([dish for dish in dishes if dish.id in ambiguities[0].candidates])
        message_parts.append(f"Dạ, nhà hàng có {choices}. Anh/chị muốn dùng món nào ạ?")
    elif stock_limits:
        limit = stock_limits[0]
        message_parts.append(
            f"Dạ nhà hàng hiện chỉ còn {limit.available} phần {limit.item_name}, "
            f"anh/chị có muốn lấy {limit.available} phần không ạ?"
        )
    elif suggestions:
        # Intent A: "Dạ, quán có món [Tên]. Anh/chị có muốn dùng không ạ?"
        if len(suggestions) == 1:
            message_parts.append(f"Dạ, quán có món {suggestions[0].name}. Anh/chị có muốn dùng không ạ?")
        else:
            choices = _friendly_candidates([dish for dish in dishes if any(s.id == dish.id for s in suggestions)])
            message_parts.append(f"Dạ, quán có các món phù hợp gồm {choices}. Anh/chị muốn dùng món nào ạ?")
    elif adds:
        noted_adds = [item for item in adds if item.note]
        if len(adds) == 1 and len(noted_adds) == 1:
            message_parts.append(f"Dạ, em đã ghi chú {noted_adds[0].note} cho món {noted_adds[0].name} ạ.")
        else:
            confirmed = ", ".join(
                f"{item.qty} phần {item.name}" + (f", ghi chú {item.note}" if item.note else "") for item in adds
            )
            message_parts.append(f"Dạ, em đã ghi nhận {confirmed}. Anh/chị có muốn gọi thêm món nào nữa không ạ?")
    elif out_of_stock:
        message_parts.append("Dạ, món anh/chị chọn hiện đã hết hàng. Anh/chị chọn món khác giúp em nhé ạ.")
    elif recommendations:
        message_parts.append(
            "Dạ, em gợi ý "
            + _friendly_candidates([dish for dish in dishes if any(item.id == dish.id for item in recommendations)])
            + ". Anh/chị muốn dùng món nào ạ?"
        )
    elif not_found:
        message_parts.append(
            f"Dạ, em chưa tìm thấy {', '.join(not_found)} trong thực đơn. Anh/chị cho em biết tên món khác nhé ạ."
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
        warnings=all_warnings,  # gồm cả allergy_only_warnings
        recommendations=recommendations,
        suggestions=suggestions,
        message=" ".join(message_parts),
    )
    # Ghi transcript theo phiên để có thể xóa khi đóng bàn; không nhận/lưu file âm thanh.
    if body.table_name:
        ban_result = await db.execute(select(Ban).where(Ban.tenban == body.table_name).limit(1))
        ban = ban_result.scalars().first()
        if ban:
            phieu_result = await db.execute(
                select(PhieuBan)
                .where(PhieuBan.ban_id == ban.ban_id, PhieuBan.hoadon_id.is_(None))
                .order_by(PhieuBan.giogoimon.desc(), PhieuBan.phieuban_id.desc())
                .limit(1)
            )
            phieu = phieu_result.scalars().first()
        else:
            phieu = None
        if phieu:
            db.add(
                LogGiongNoi(
                    phieuban_id=phieu.phieuban_id,
                    vanbangoc=body.transcript,
                    ydinhai=result.model_dump(mode="json"),
                )
            )
            await db.commit()
    return result
