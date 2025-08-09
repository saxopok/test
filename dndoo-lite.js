;(() => {
  // Настройки по умолчанию
  const SEL_OBJ = '[data-ref="objet"]';
  const SEL_SLOT = '[data-ref="cible"]';

  // Базовые стили одним проходом (не мешают твоим inline-стилям)
  const style = document.createElement('style');
  style.textContent = `
    ${SEL_OBJ}, ${SEL_SLOT} {
      opacity: .5;               /* как просил */
      user-select: none;
      touch-action: none;        /* для тачей */
      border-radius: 8px;
    }
    ${SEL_SLOT}.dnd-hit { outline: 2px solid #4caf50; }
    ${SEL_SLOT}.dnd-locked { outline: 2px solid #2e7d32; }
    ${SEL_OBJ}[data-locked="true"] { cursor: default !important; }
  `;
  document.head.appendChild(style);

  const state = { active: null, slots: [] };

  function rect(el){ return el.getBoundingClientRect(); }
  function px(n){ return n + 'px'; }
  function nearestHitSlot(dragEl){
    let best = null, bestArea = 0;
    for (const slot of state.slots){
      if (slot.dataset.locked === 'true') continue;
      const r1 = rect(dragEl), r2 = rect(slot);
      const w = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
      const h = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
      const area = w * h;
      if (area > bestArea) { bestArea = area; best = slot; }
    }
    return best;
  }

  function onPointerDown(e){
    const el = e.currentTarget;
    if (el.dataset.locked === 'true') return;
    el.setPointerCapture(e.pointerId);
    const p = el.offsetParent || el.parentElement || document.body;
    const pRect = p.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    state.active = {
      el,
      parent: p,
      parentRect: pRect,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: elRect.left - pRect.left,
      origTop:  elRect.top  - pRect.top
    };
    el.style.cursor = 'grabbing';
  }

  function onPointerMove(e){
    if (!state.active) return;
    const a = state.active;
    const dx = e.clientX - a.startX;
    const dy = e.clientY - a.startY;
    a.el.style.left = px(a.origLeft + dx);
    a.el.style.top  = px(a.origTop  + dy);

    // подсветка слота под объектом
    document.querySelectorAll(SEL_SLOT).forEach(s => s.classList.remove('dnd-hit'));
    const hit = nearestHitSlot(a.el);
    if (hit) hit.classList.add('dnd-hit');
  }

  function onPointerUp(e){
    if (!state.active) return;
    const a = state.active;
    a.el.style.cursor = 'grab';
    document.querySelectorAll(SEL_SLOT).forEach(s => s.classList.remove('dnd-hit'));

    const slot = nearestHitSlot(a.el);
    if (!slot) { state.active = null; return; }

    const ok = (a.el.dataset.num && slot.dataset.num && a.el.dataset.num === slot.dataset.num);
    if (ok){
      // центрируем объект в слоте
      const sRect = slot.getBoundingClientRect();
      const pRect = a.parent.getBoundingClientRect();
      const dRect = a.el.getBoundingClientRect();
      const left = (sRect.left - pRect.left) + (sRect.width - dRect.width)/2;
      const top  = (sRect.top  - pRect.top)  + (sRect.height - dRect.height)/2;
      a.el.style.left = px(left);
      a.el.style.top  = px(top);
      a.el.dataset.locked = 'true';
      slot.classList.add('dnd-locked');

      if (slot.dataset.hide === 'true'){ a.el.style.opacity = '0'; }

      a.el.dispatchEvent(new CustomEvent('dnd:match', { detail:{ objet:a.el, cible:slot }}));
    } else {
      a.el.dispatchEvent(new CustomEvent('dnd:mismatch', { detail:{ objet:a.el, cible:slot }}));
    }
    state.active = null;
  }

  function makeDraggable(el){
    if (el._dndInited) return;
    el._dndInited = true;
    el.style.position = el.style.position || 'absolute';
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
  }

  function collect(){
    state.slots = Array.from(document.querySelectorAll(SEL_SLOT));
    document.querySelectorAll(SEL_OBJ).forEach(makeDraggable);
  }

  // Публичное API
  window.DNDo = {
    init(){ collect(); },
    validate(){
      const drags = Array.from(document.querySelectorAll(SEL_OBJ));
      const slots = Array.from(document.querySelectorAll(SEL_SLOT));
      const ids = new Set([...drags, ...slots].map(el => el.dataset.num).filter(Boolean));
      let correct = 0;
      ids.forEach(id => {
        const anyDragLocked = drags.some(d => d.dataset.num === id && d.dataset.locked === 'true');
        const slotLocked    = slots.some(s => s.dataset.num === id && s.classList.contains('dnd-locked'));
        if (anyDragLocked && slotLocked) correct++;
      });
      return { total: ids.size, correct, pending: Math.max(0, ids.size - correct) };
    }
  };

  // Авто-инициализация + реакция на динамические вставки
  document.addEventListener('DOMContentLoaded', () => {
    collect();
    const mo = new MutationObserver(() => collect());
    mo.observe(document.body, { childList:true, subtree:true });
  });
})();
