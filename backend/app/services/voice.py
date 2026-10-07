import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import ThucDon
from app.models.order import PhienBan
from app.models.voice import LogGiongNoi
from app.schemas.voice import (
    VoiceAdd,
    VoiceAmbiguity,
    VoiceInterpretIn,
    VoiceInterpretOut,
    VoiceOos,
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
    r"không\s+(?:lấy\s+[\wÀ-ỹ]+|[\wÀ-ỹ]+)|"
    r"bỏ\s+[\wÀ-ỹ]+|ít\s+[\wÀ-ỹ]+|nhiều\s+[\wÀ-ỹ]+|thêm\s+[\wÀ-ỹ]+",
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


def _quantity_and_text(segment: str) -> tuple[int, str]:
    cleaned = re.sub(r"^\s*(?:cho|thêm|lấy|order)\s+", "", segment, flags=re.IGNORECASE)
    cleaned = re.sub(r"^\s*(?:tôi|mình|anh/chị|anh chị)\s+", "", cleaned, flags=re.IGNORECASE)
    match = re.match(r"^\s*(\d+|[\wÀ-ỹ]+)\b\s*", cleaned, flags=re.IGNORECASE)
    if not match:
        return 1, cleaned
    quantity_word = normalize(match.group(1))
    if not quantity_word.isdigit() and quantity_word not in QUANTITIES:
        return 1, cleaned
    quantity = int(quantity_word) if quantity_word.isdigit() else QUANTITIES[quantity_word]
    remainder = cleaned[match.end():]
    remainder = re.sub(
        r"^\s*(?:phần|suất|ly|chai|cốc|bát|đĩa)\s+", "", remainder, flags=re.IGNORECASE
    )
    return max(quantity, 1), remainder


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


def _note_for(segment: str) -> str:
    notes = [note.strip().capitalize() for note in NOTE_PATTERN.findall(segment)]
    return ", ".join(dict.fromkeys(notes))


def _friendly_candidates(dishes: list[ThucDon]) -> str:
    names = [dish.tenmon for dish in dishes]
    if len(names) == 2:
        return f"{names[0]} và {names[1]}"
    if len(names) > 2:
        return f"{', '.join(names[:-1])} và {names[-1]}"
    return names[0] if names else "món phù hợp"


async def interpret(db: AsyncSession, body: VoiceInterpretIn) -> VoiceInterpretOut:
    dishes = list((await db.execute(select(ThucDon).order_by(ThucDon.tenmon))).scalars().all())
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
    draft_quantities = {line.item_id: line.quantity for line in body.draft}
    reported_allergies = _allergies_in(body.transcript)

    for segment in _segments(analysis_text, dishes):
        quantity, item_text = _quantity_and_text(segment)
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
            if dish.soluongton is not None:
                available = max(dish.soluongton - draft_quantities.get(dish.id, 0), 0)
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
                            f"Lưu ý, {dish.tenmon} có chứa hoặc có thể có {allergen}. "
                            "Vì anh/chị báo dị ứng, em xin phép báo nhân viên"
                            " kiểm tra trước khi chốt món ạ."
                        ),
                    )
                )

    has_recommendation_intent = any(
        phrase in normalized_text for phrase in ("goi y", "tu van", "nen an", "mon nao")
    )
    recommendations: list[VoiceRecommendation] = []
    if has_recommendation_intent:
        recommendations = [
            VoiceRecommendation(id=item.id, name=item.tenmon, price=int(item.giaban))
            for item in dishes
            if not item.het_hang
            and not any(_dish_contains_allergen(item, allergy) for allergy in reported_allergies)
        ][:3]

    if adds or out_of_stock or ambiguities or stock_limits or not_found:
        intent = "order"
    elif suggestions:
        intent = "suggestion"
    elif has_recommendation_intent:
        intent = "recommendation"
    else:
        intent = "unknown"
    if warnings:
        message_parts = [warning.message for warning in warnings]
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
        choices = _friendly_candidates(
            [dish for dish in dishes if any(s.id == dish.id for s in suggestions)]
        )
        if len(suggestions) == 1:
            message_parts.append(
                f"Dạ, quán có món {choices}. Anh/chị có muốn dùng không ạ?"
            )
        else:
            message_parts.append(
                f"Dạ, quán có các món phù hợp gồm {choices}. Anh/chị muốn dùng món nào ạ?"
            )
    elif adds:
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
        warnings=warnings,
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
