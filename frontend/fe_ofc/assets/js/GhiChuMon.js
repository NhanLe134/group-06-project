/* =====================================================================
   GhiChuMon.js — Ghi chú từng món trong giỏ (ADR-N01)
   ---------------------------------------------------------------------
   Chứa:
   - openNoteEditor()    : mở modal ghi chú cho 1 món trong giỏ
   - saveNote()          : lưu ghi chú vào dòng món trong giỏ
   - Sự kiện: nút Lưu, nút Xóa ghi chú
   ===================================================================== */

function openNoteEditor(idx) {
  const it = draft[idx];
  if (!it) return;
  editingNoteIdx = idx;  /* biến toàn cục để biết món nào đang mở modal ghi chú */
  $('#note-title').textContent = `Ghi chú — ${dishById(it.id).name}`;
  $('#note-input').value = it.note || '';
  $('#note-modal').style.display = 'grid';
}
function closeNoteEditor() {
  editingNoteIdx = null;
  $('#note-modal').style.display = 'none';
}
function saveNote() {
  if (editingNoteIdx === null || !draft[editingNoteIdx]) return closeNoteEditor();
  draft[editingNoteIdx].note = $('#note-input').value.trim();
  closeNoteEditor();
  renderDraft();  /* cập nhật lại danh sách món trong giỏ có ghi chú */
}

/* ===================== SỰ KIỆN ===================== */

$('#btn-note-save').addEventListener('click', saveNote);
$('#btn-note-clear').addEventListener('click', () => {
  if (editingNoteIdx !== null && draft[editingNoteIdx]) draft[editingNoteIdx].note = '';
  closeNoteEditor();
  renderDraft();
});
