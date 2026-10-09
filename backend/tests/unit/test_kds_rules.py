"""US-03 KDS — unit test quy tắc chuyển trạng thái (không DB, không HTTP).

Tầng Unit của testing pyramid (giáo trình §11.2). Test cases: testing/test_cases/test-cases-US03.md.
"""

import pytest

from app.errors import ApiError
from app.models import ChiTietPhieu
from app.services.kds import (
    CHO_NAU,
    DA_XONG,
    DANG_NAU,
    TRANSITIONS,
    _bep_bao_het,
    _check_transition,
)


def _item(trangthai: str | None) -> ChiTietPhieu:
    return ChiTietPhieu(trangthai=trangthai, soluong=1)


@pytest.mark.parametrize(
    ("current", "target"),
    [
        (CHO_NAU, DANG_NAU),
        (CHO_NAU, DA_XONG),
        (DANG_NAU, DA_XONG),
        (DANG_NAU, CHO_NAU),
        (DA_XONG, DANG_NAU),
    ],
)
def test_allowed_transitions_forward_and_one_step_back(current, target):
    """TC-OP-KDS-004/007: tiến tới, hoặc lùi 1 bước để hoàn tác."""
    _check_transition(_item(current), False, target)  # không ném lỗi


@pytest.mark.parametrize(
    ("current", "target"),
    [(DA_XONG, DA_XONG), (DANG_NAU, DANG_NAU), (DA_XONG, CHO_NAU), ("da_huy", DANG_NAU)],
)
def test_rejected_transitions_including_double_click(current, target):
    """TC-OP-KDS-005: bấm "Xong" 2 lần (cùng trạng thái), nhảy lùi 2 bước, món đã hủy → 409."""
    with pytest.raises(ApiError) as err:
        _check_transition(_item(current), False, target)
    assert (err.value.status_code, err.value.error_code) == (409, "INVALID_STATUS_TRANSITION")


def test_missing_status_is_treated_as_pending():
    """Dữ liệu cũ có trangthai NULL được coi là Chờ nấu."""
    _check_transition(_item(None), False, DANG_NAU)


def test_pending_item_blocked_only_when_kitchen_marked_out_of_stock():
    """TC-OP-KDS-008: bếp báo hết → món Chờ nấu không được nấu, chỉ được xóa khỏi hàng đợi."""
    with pytest.raises(ApiError) as err:
        _check_transition(_item(CHO_NAU), True, DANG_NAU)
    assert err.value.error_code == "ITEM_OUT_OF_STOCK"
    _check_transition(_item(DANG_NAU), True, DA_XONG)  # đang nấu dở thì vẫn cho xong


def test_kitchen_block_flag_comes_only_from_manual_out_of_stock():
    """TC-OP-KDS-010 / BUG-US03-001: chỉ `trangthaiban = false` (báo tay) mới chặn nấu."""
    assert _bep_bao_het(False) is True
    assert _bep_bao_het(True) is False
    assert _bep_bao_het(None) is False


def test_transition_table_has_no_way_out_of_cancelled():
    assert "da_huy" not in TRANSITIONS
