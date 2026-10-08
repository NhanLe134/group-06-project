"""Trừ kho tự động — unit test cách tính số phần còn / hết hàng (không DB, không HTTP).

Spec: vault/06-Engineering/story-spec-tru-kho-tu-dong.md Mục 3. Test cases: test-cases-US03.md.
"""

from decimal import Decimal

from app.models import CongThuc, ThucDon, TonKho
from app.services.stock import flipped


def _mon(soluongton: int | None = None, trangthaiban: bool = True, **recipe: str) -> ThucDon:
    """recipe: tên nguyên liệu = "tồn:định lượng", vd. bo="1:0.2" (1 kg bò, 0.2 kg/phần)."""
    mon = ThucDon(tenmon="Món thử", phanloai="Món chính", giaban=10000,
                  soluongton=soluongton, trangthaiban=trangthaiban)
    for ten, spec in recipe.items():
        ton, dinhluong = (Decimal(x) for x in str(spec).split(":"))
        mon.congthuc.append(
            CongThuc(nguyenlieu=TonKho(tennguyenlieu=ten, donvitinh="kg", tonhethong=ton),
                     dinhluong=dinhluong)
        )
    return mon


def test_bought_item_counts_by_quantity_and_ignores_recipe():
    """Món mua sẵn (có soluongton): số phần = soluongton, bỏ qua công thức."""
    assert _mon(soluongton=46, duong="0:1").so_phan_con == 46
    assert _mon(soluongton=0).so_phan_con == 0


def test_cooked_item_is_limited_by_scarcest_ingredient():
    """Món chế biến: min(⌊tồn ÷ định lượng⌋) — AC1 của spec trừ kho."""
    assert _mon(bo="1:0.2", can="3:0.1").so_phan_con == 5
    assert _mon(bo="0.6:0.2").so_phan_con == 3
    assert _mon(bo="0.19:0.2").so_phan_con == 0  # biên: thiếu 0.01 kg là không đủ 1 phần


def test_cooked_item_without_recipe_is_unlimited():
    assert _mon().so_phan_con is None
    assert _mon().het_hang is False


def test_out_of_stock_when_manual_off_or_no_portion_left():
    assert _mon(trangthaiban=False, bo="10:0.2").het_hang is True  # bếp báo hết tay
    assert _mon(bo="0.1:0.2").het_hang is True  # hết nguyên liệu
    assert _mon(soluongton=0).het_hang is True  # hết hàng mua sẵn
    assert _mon(bo="0.2:0.2").het_hang is False


def test_flipped_reports_only_dishes_that_changed_state():
    """Chỉ món đổi còn ↔ hết mới phát ITEM_OOS_BROADCAST."""
    con, het = _mon(bo="1:0.2"), _mon(bo="1:0.2")
    watch = {"A": (con, False), "B": (het, False)}
    het.congthuc[0].nguyenlieu.tonhethong = Decimal("0.1")
    assert flipped(watch) == [het]
