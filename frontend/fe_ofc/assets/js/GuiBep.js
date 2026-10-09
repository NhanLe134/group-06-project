/* =====================================================================
   GuiBep.js — Xác nhận gửi bếp (BR-01 Explicit Confirmation + BR-03)
   ---------------------------------------------------------------------
   Chứa:
   - openConfirm/closeConfirm : modal xác nhận trước khi gửi (BR-01)
   - sendToKitchen()          : POST /orders → backend tạo phiếu bàn mới
                                cho lần gọi này (ADR-N14), trừ kho theo công thức
   - Sự kiện: nút "Xác nhận gửi bếp" trong giỏ, Hủy/Xác nhận, đóng popup thành công
   Nghiệp vụ: BR-03 — đơn sau khi gửi KHÔNG tự hủy được trên máy (BR-05).
   ===================================================================== */

function openConfirm() {
  if (!draft.length || draftHasOos()) return;   /* ADR-001 — chặn thêm 1 lớp */
  $('#confirm-text').textContent =
    `Xác nhận gửi ${draftUnits()} món xuống bếp? Đơn sau khi gửi sẽ không thể tự hủy trên máy.`;
  /* confirm-total là tùy chọn (có thể bị bỏ khỏi HTML) */
  setText('#confirm-total', fmtVND(draftTotal()));
  $('#confirm-modal').style.display = 'grid';
}
function closeConfirm() { $('#confirm-modal').style.display = 'none'; }

async function sendToKitchen() {
  if (!draft.length || draftHasOos()) return;
  try {
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        table_name: tableName,
        items: draft.map(x => ({
          thucdon_id: x.id,       /* MÃ món trong thucdon (Supabase) */
          soluong: x.qty,
          ghichu: x.note || null,
        })),
      }),
    });
  } catch (e) {
    closeConfirm();
    showApiError(e);
    return;
  }
  draft = [];
  closeConfirm();
  closeDraft();
  renderStickyBar();
  renderMenu();   /* ADR-N06: giỏ đã trống → bộ đếm trên thẻ món về lại nút "+" cho vòng gọi mới */
  /* success-code / success-total / success-table là tùy chọn — popup vẫn phải mở dù phần tử bị xóa */
  setText('#success-code', `Hóa đơn của ${tableName}`);
  setText('#success-total', fmtVND(draftTotal()));
  setText('#success-table', tableName);
  $('#success-modal').style.display = 'grid';
}

/* ===================== SỰ KIỆN ===================== */

$('#draft-footer').addEventListener('click', e => {
  if (e.target.closest('[data-open-confirm]')) openConfirm();
});
$('#btn-cancel-confirm').addEventListener('click', closeConfirm);
$('#btn-confirm-send').addEventListener('click', sendToKitchen);
$('#btn-close-success').addEventListener('click', () => {
  $('#success-modal').style.display = 'none';
});
