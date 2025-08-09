<script>
// UMD-обёртка на один глобал DND
window.DND = window.DND || (() => {
  const api = {};
  const state = {
    drags: new Set(),
    active: null, // {el, startX, startY, origLeft, origTop}
  };

  function px(n){ return `${n}px`; }
  function getXY(el){ return { left: el.offsetLeft, top: el.offsetTop }; }

  function onPointerDown(e){
    const el = e.currentTarget;
    if (el.dataset.locked === 'true') return; // уже закреплён
    el.setPointerCapture(e.pointerId);
    const { left, top } = getXY(el);
    state.active = {
      el,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: left,
      origTop: top
    };
  }

  function onPointerMove(e){
    if (!state.active) return;
    const a = state.active;
    const dx = e.clientX - a.startX;
    const dy = e.clientY - a.startY;
    a.el.style.left = px(a.origLeft + dx);
    a.el.style.top  = px(a.origTop  + dy);

    // Шлём кастомное событие "двигаюсь" — для подсветки слотов
    const ev = new CustomEvent('dnd:dragging', { detail: { drag: a.el }});
    document.dispatchEvent(ev);
  }

  function onPointerUp(e){
    if (!state.active) return;
    const a = state.active;

    // Сообщаем системе слотов, что мы “уронили”
    const dropEv = new CustomEvent('dnd:drop', { bubbles: true, detail: { drag: a.el }});
    a.el.dispatchEvent(dropEv);

    a.el.releasePointerCapture(e.pointerId);
    state.active = null;
  }

  api.initDraggables = function(selector = '.dnd-drag'){
    document.querySelectorAll(selector).forEach(el => {
      if (state.drags.has(el)) return;
      state.drags.add(el);
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
    });
  };

  return api;
})();
</script>
