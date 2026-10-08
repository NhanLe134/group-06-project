/* =====================================================================
   HoaDon.js — US-09: Trang xem Hóa đơn tạm tính (ADR-N05) + Yêu cầu thanh toán
   ---------------------------------------------------------------------
   Chứa:
   - buildBillTable()   : bảng hóa đơn NHÓM THEO ĐỢT GỌI (ADR-N13)
   - openBillView()     : GET /orders/current → hiển thị; 404 = bàn trống
   - requestPayment()   : AC2 cảnh báo khi còn món chờ / AC3 báo ra quầy
   - Sự kiện: Xem hóa đơn, đóng, Yêu cầu thanh toán, đóng modal
   Trạng thái khách thấy (3 mức): Chờ nấu → Chờ phục vụ → Đã phục vụ
   Nghiệp vụ: BR-05 — hóa đơn không có nút hủy/xóa đơn.
   ===================================================================== */

/* 3 trạng thái khách thấy (ADR-N14): cho_nau/dang_nau → Chờ nấu,
   da_xong → Chờ phục vụ, da_phuc_vu → Đã phục vụ */
const TRANGTHAI_LABEL = {
  cho_nau: 'Chờ nấu',
  dang_nau: 'Chờ nấu',
  da_xong: 'Chờ phục vụ',
  da_phuc_vu: 'Đã phục vụ',
};

/* ADR-N13: nhóm món theo đợt gọi (backend gán `dot` theo mốc giogoimon) */
function buildBillTable(bill) {
  const groups = [];
  bill.items.forEach(it => {
    let g = groups.find(x => x.dot === it.dot);
    if (!g) {
      g = { dot: it.dot, gio: it.giogoimon, items: [] };
      groups.push(g);
    }
    g.items.push(it);
  });

  const fmtTime = iso => iso
    ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const itemRow = it => {
    const done = it.trangthai === 'da_phuc_vu';
    return `
      <tr>
        <td>${esc(it.tenmon || '')}${it.ghichu ? `<small>${esc(it.ghichu)}</small>` : ''}</td>
        <td class="num">${it.soluong}</td>
        <td class="num">${fmtVND(it.thanhtien)}</td>
        <td><span class="status-pill ${done ? 'st-served' : 'st-pending'}">
          ${TRANGTHAI_LABEL[it.trangthai] || it.trangthai}</span></td>
      </tr>`;
  };

  const body = groups.map((g, idx) => `
    <tr class="dot-row"><td colspan="4">
      <i class="ph-bold ph-basket"></i> Đợt ${idx + 1} — gọi lúc ${fmtTime(g.items[0].giogoimon)}
      · ${g.items.length} món
    </td></tr>
    ${g.items.map(itemRow).join('')}`).join('');

  const totalQty = bill.items.reduce((n, it) => n + it.soluong, 0);
  return `
    <div class="bill">
      <table class="bill-table">
        <thead><tr><th>Món</th><th class="num">SL</th><th class="num">Thành tiền</th><th>Trạng thái</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <div class="bill-foot">
        <span>Tổng số món: <b>${totalQty}</b></span>
        <span>Tổng thành tiền: <b>${fmtVND(bill.tongtien)}</b></span>
      </div>
    </div>`;
}

/* US-09 — tải hóa đơn tạm tính từ GET /orders/current, hiển thị trang hóa đơn */
let currentBill = null;   /* OrderCurrentOut từ API */

async function openBillView() {
  const body = $('#bill-body');
  body.innerHTML = `
    <div class="draft-empty">
      <i class="ph-duotone ph-spinner"></i>
      <p>Đang tải hóa đơn...</p>
    </div>`;
  $('#bill-view').hidden = false;
  try {
    currentBill = await apiFetch(
      `/orders/current?table_name=${encodeURIComponent(tableName)}`,
    );
  } catch (e) {
    currentBill = null;
    body.innerHTML = `
      <div class="draft-empty">
        <i class="ph-duotone ph-receipt"></i>
        <p>${e.status === 404
          ? 'Bàn chưa gọi món nào. Hãy chọn món từ E-Menu trước nhé!'
          : esc(e.message)}</p>
        ${e.status !== 404 ? '<button class="btn-primary" onclick="openBillView()">Thử lại</button>' : ''}
      </div>`;
    $('#btn-request-pay').disabled = true;
    return;
  }

  body.innerHTML = buildBillTable(currentBill);

  /* US-09 AC2/AC3: còn món chưa phục vụ → nút khóa + hộp cảnh báo vàng;
     tất cả 'da_phuc_vu' → bật nút xanh */
  const box = $('#bill-warn-box');
  if (box) box.remove();
  if (!currentBill.all_served) {
    $('#btn-request-pay').disabled = true;
    body.insertAdjacentHTML(
      'afterbegin',
      `<div class="adr-warn" style="margin-bottom:14px;">
        <i class="ph-fill ph-warning-circle"></i>
        <p>Vẫn còn món đang được chế biến/chờ bưng. Vui lòng đợi nhân viên phục vụ đủ món rồi yêu cầu thanh toán nhé!</p>
      </div>`,
    );
  } else {
    $('#btn-request-pay').disabled = false;
  }
}

/* AC2: còn món chờ → cảnh báo; AC3: đã phục vụ hết → hướng dẫn ra quầy +
   gửi tín hiệu thông báo thu ngân (hiện tại là modal; sau này qua WebSocket) */
function requestPayment() {
  if (!currentBill) return;
  const icon = $('#pay-icon'), title = $('#pay-title'), msg = $('#pay-msg');
  if (!currentBill.all_served) {
    icon.className = 'modal-icon warn';
    icon.innerHTML = '<i class="ph-fill ph-warning-circle"></i>';
    title.textContent = 'Chưa thể thanh toán';
    msg.textContent = 'Bạn còn món chờ phục vụ. Vui lòng đợi nhân viên bưng món ra đủ, kiểm tra lại hóa đơn rồi hãy yêu cầu thanh toán nhé. Nếu cần hỗ trợ gấp, xin gọi nhân viên!';
  } else {
    icon.className = 'modal-icon green';
    icon.innerHTML = '<i class="ph-bold ph-check"></i>';
    title.textContent = 'Đã gửi yêu cầu thanh toán';
    msg.textContent = 'Đã báo thu ngân chuẩn bị hóa đơn. Vui lòng đến quầy thu ngân để thanh toán. Xin cảm ơn!';
  }
  $('#pay-modal').style.display = 'grid';
}

/* ===================== SỰ KIỆN ===================== */

/* ----- Trang hóa đơn + yêu cầu thanh toán ----- */
$('#btn-view-bill').addEventListener('click', openBillView);
$('#btn-close-bill').addEventListener('click', () => { $('#bill-view').hidden = true; });
$('#btn-request-pay').addEventListener('click', requestPayment);
$('#btn-pay-close').addEventListener('click', () => { $('#pay-modal').style.display = 'none'; });
