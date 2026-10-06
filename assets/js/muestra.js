/* muestraimpecable — revelador antes/después */
(function () {
  'use strict';
  var el = document.getElementById('revelar');
  if (!el) return;
  var capa = document.getElementById('revelarCapa');
  var mando = document.getElementById('revelarMando');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pos = 50, activo = false, tocado = false;

  function pintar() {
    capa.style.clipPath = 'inset(0 ' + (100 - pos).toFixed(2) + '% 0 0)';
    mando.style.left = pos.toFixed(2) + '%';
    mando.setAttribute('aria-valuenow', String(Math.round(pos)));
    el.classList.toggle('revelar--sin-antes', pos < 22);
    el.classList.toggle('revelar--sin-despues', pos > 78);
  }

  function deEvento(e) {
    var r = el.getBoundingClientRect();
    var x = (e.clientX !== undefined) ? e.clientX :
      (e.touches && e.touches[0] ? e.touches[0].clientX : r.left);
    return Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100));
  }

  el.addEventListener('pointerdown', function (e) {
    activo = true; tocado = true;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    pos = deEvento(e); pintar();
  });
  el.addEventListener('pointermove', function (e) {
    if (!activo) return;
    if (e.cancelable) e.preventDefault();
    pos = deEvento(e); pintar();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    el.addEventListener(ev, function () { activo = false; });
  });

  mando.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    tocado = true;
    pos = Math.min(100, Math.max(0, pos + (e.key === 'ArrowRight' ? 5 : -5)));
    pintar();
    e.preventDefault();
  });

  /* Invitación: un leve vaivén la primera vez que entra en vista */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting || tocado) return;
        io.disconnect();
        var t0 = null;
        (function paso(t) {
          if (tocado) { pos = 50; pintar(); return; }
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / 1500);
          pos = 50 + Math.sin(k * Math.PI * 2) * 9 * (1 - k);
          pintar();
          if (k < 1) requestAnimationFrame(paso);
          else { pos = 50; pintar(); }
        })(performance.now());
      });
    }, { threshold: 0.35 });
    io.observe(el);
  }

  pintar();

  /* Scroll infinito y sincronizado de las dos webs */
  var scrollAntes = document.getElementById('scrollAntes');
  var scrollDespues = document.getElementById('scrollDespues');
  var VELOCIDAD = 150; /* px por segundo: la duración se adapta al contenido */
  var enVista = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      enVista = es[0].isIntersecting;
    }, { threshold: 0.12 }).observe(el);
  } else { enVista = true; }
  function maxDespl(s) {
    return Math.max(0, s.scrollHeight - el.clientHeight);
  }
  var tScroll = null;
  function bucle(t) {
    requestAnimationFrame(bucle);
    if (!enVista || reduce || document.hidden) { tScroll = t; return; }
    if (tScroll === null) tScroll = t;
    var rango = Math.max(maxDespl(scrollAntes), maxDespl(scrollDespues));
    var dur = Math.min(30000, Math.max(9000, rango / VELOCIDAD * 1000));
    var ciclo = ((t - tScroll) % (dur * 2)) / dur; /* 0..2 */
    var k = ciclo < 1 ? ciclo : 2 - ciclo;         /* ping-pong 0..1..0 */
    k = k * k * (3 - 2 * k);                       /* suavizado */
    scrollAntes.style.transform = 'translateY(' + (-k * maxDespl(scrollAntes)).toFixed(1) + 'px)';
    scrollDespues.style.transform = 'translateY(' + (-k * maxDespl(scrollDespues)).toFixed(1) + 'px)';
  }
  requestAnimationFrame(bucle);
})();

/* Vídeo diferido: carga y reproduce solo al entrar en vista (está bajo el pliegue) */
(function () {
  'use strict';
  var v = document.querySelector('video[data-diferido]');
  if (!v) return;
  function arrancar() {
    v.querySelectorAll('source[data-src]').forEach(function (s) {
      s.src = s.getAttribute('data-src'); s.removeAttribute('data-src');
    });
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if (!('IntersectionObserver' in window)) { arrancar(); return; }
  new IntersectionObserver(function (es, io) {
    if (es[0].isIntersecting) { io.disconnect(); arrancar(); }
  }, { rootMargin: '200px' }).observe(v);
})();
