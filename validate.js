<script>
window.DND = window.DND || {};
(() => {
  function pairs(){
    const drags = Array.from(document.querySelectorAll('.dnd-drag'));
    const slots = Array.from(document.querySelectorAll('.dnd-slot'));
    // собираем успешные “пары” по флагу locked и совпадению id
    const matched = drags.filter(d => d.dataset.locked === 'true');
    const total = Math.max(
      new Set(drags.map(d => d.dataset.dndId)).size,
      new Set(slots.map(s => s.dataset.dndId)).size
    );
    const correct = matched.filter(d => {
      // ищем слот с тем же id и помеченный .dnd-locked
      const id = d.dataset.dndId;
      return slots.some(s => s.dataset.dndId === id && s.classList.contains('dnd-locked'));
    }).length;

    return { total, correct, pending: Math.max(0, total - correct) };
  }

  window.DND.validateAll = function(){
    return pairs();
  };

  // Удобная обвязка для кнопки (опционально)
  window.DND.attachValidateButton = function(selector){
    const btn = document.querySelector(selector);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const r = pairs();
      alert(`Правильно: ${r.correct} из ${r.total}`);
    });
  };
})();
</script>
