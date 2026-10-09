/* =====================================================================
   GhiChuMon.js — Ghi chú từng món trong giỏ (ADR-N01)
   ---------------------------------------------------------------------
   Chứa:
   - NOTE_SUGGESTIONS    : chip gợi ý nhanh (Không hành, Ít cay...)
   - openNoteEditor()    : mở modal ghi chú cho 1 món trong giỏ
   - toggleNoteChip()    : chạm chip → nối/bỏ nội dung khỏi ô ghi chú
   - saveNote()          : lưu ghi chú vào dòng món trong giỏ
   - Sự kiện: chip, nút Lưu, nút Xóa ghi chú
   ===================================================================== */

/* ----- Gợi ý ghi chú nhanh (ADR-N01) — chạm để nối vào ô ghi chú ----- */
const NOTE_SUGGESTIONS = [
  'Không hành', 'Không rau', 'Ít cay', 'Nhiều cay',
  'Không đá', 'Ít ngọt', 'Chia đôi phần',
];

function openNoteEditor(idx) {
  const it = draft[idx];
  if (!it) return;
  editingNoteIdx = idx;
  $('#note-title').textContent = `Ghi chú — ${dishById(it.id).name}`;
  $('#note-input').value = it.note || '';
  renderNoteChips();
  $('#note-modal').style.display = 'grid';
}
function closeNoteEditor() {
  editingNoteIdx = null;
  $('#note-modal').style.display = 'none';
}
function renderNoteChips() {
  const current = $('#note-input').value.toLowerCase();
  $('#note-chips').innerHTML = NOTE_SUGGESTIONS.map(s => `
    <button type="button" class="note-chip ${current.includes(s.toLowerCase()) ? 'picked' : ''}"
      data-note-chip="${esc(s)}">
      ${current.includes(s.toLowerCase())
        ? '<i class="ph-bold ph-check"></i>' : '<i class="ph-bold ph-plus"></i>'} ${s}
    </button>`).join('');
}
/* Chạm chip → nối nội dung vào ô ghi chú (tránh trùng), chạm lại → bỏ khỏi ô */
function toggleNoteChip(text) {
  const input = $('#note-input');
  const parts = input.value.split(',').map(p => p.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const i = parts.findIndex(p => p.toLowerCase() === lower);
  if (i >= 0) parts.splice(i, 1); else parts.push(text);
  input.value = parts.join(', ');
  renderNoteChips();
}
function saveNote() {
  if (editingNoteIdx === null || !draft[editingNoteIdx]) return closeNoteEditor();
  draft[editingNoteIdx].note = $('#note-input').value.trim();
  closeNoteEditor();
  renderDraft();
}

/* ===================== SỰ KIỆN ===================== */

/* Modal ghi chú món */
$('#note-chips').addEventListener('click', e => {
  const chip = e.target.closest('[data-note-chip]');
  if (chip) toggleNoteChip(chip.dataset.noteChip);
});
$('#btn-note-save').addEventListener('click', saveNote);
$('#btn-note-clear').addEventListener('click', () => {
  if (editingNoteIdx !== null && draft[editingNoteIdx]) draft[editingNoteIdx].note = '';
  closeNoteEditor();
  renderDraft();
});
