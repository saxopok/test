<script>
window.DND = window.DND || {};
(() => {
  const slots = new Set();

  function rect(el){ return el.getBoundingClientRect(); }
  function hitTest(a, b){
    const r1 = rect(a), r2 = rect(b);
    return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
  }

  function nearestHitSlot(dragEl){
    let best = null, bestArea = 0;
    slots.forEach(slot => {
      if (slot.dataset.locked === 'true') return;
      if (hitTest(dragEl, slot)) {
        // оценим площадь пересечения (упрощённо как пересечение проекций)
        const r1 = rect(dragEl), r2 = rect(slot);
        const w = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const h = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
        const area = w*h;
        if (area > bestArea){ best = slot; bestArea = area; }
      }
    });
    return best;
  }

  // Подсветка слота под курсором
  document.addEventListener('dnd:dragging', (e) => {
    const drag = e.detail.drag;
    let active = null;
    slots.forEach(s => s.classList.remove('dnd-hit'));
    const hit = nearestHitSlot(drag);
    if (hit) hit.classList.add('dnd-hit');
  });

  // Обработка "бросили"
  document.addEventListener('dnd:drop', (e) => {
    const drag = e.detail.drag;
    slots.forEach(s => s.classList.remove('dnd-hit')); // снять подсветку

    const slot = nearestHitSlot(drag);
    if (!slot) {
      // Мимо слотов — считаем несовпадением
      const ev = new CustomEvent('dnd:mismatch', { detail: { drag, slot: null }});
      document.dispatchEvent(ev);
      return;
    }

    const ok = (drag.dataset.dndId && slot.dataset.dndId && drag.dataset.dndId === slot.dataset.dndId);

    if (ok){
      // Привязываем: ставим drag в центр слота, блокируем
      const sRect = slot.getBoundingClientRect();
      const dRect = drag.getBoundingClientRect();
      const dx = sRect.left + (sRect.width - dRect.width)/2 + window.scrollX;
      const dy = sRect.top  + (sRect.height - dRect.height)/2 + window.scrollY;

      // Позиционируем относительно родителя (offsetParent)
      const parentRect = drag.offsetParent.getBoundingClientRect();
      drag.style.left = (dx - parentRect.left) + 'px';
      drag.style.top  = (dy - parentRect.top)  + 'px';

      drag.dataset.locked = 'true';
      slot.classList.add('dnd-locked');

      // Спрятать перетащенный? (по запросу)
      if (slot.dataset.hideDrag === 'true'){
        drag.style.opacity = '0'; // “спрятали” под вторым
      }

      const ev = new CustomEvent('dnd:match', { detail: { drag, slot }});
      document.dispatchEvent(ev);
    } else {
      const ev = new CustomEvent('dnd:mismatch', { detail: { drag, slot }});
      document.dispatchEvent(ev);
    }
  });

  window.DND.initSlots = function(selector = '.dnd-slot'){
    document.querySelectorAll(selector).forEach(el => slots.add(el));
  };
})();
</script>
