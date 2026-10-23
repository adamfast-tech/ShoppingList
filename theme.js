// Applique le thème (clair / sombre / auto) avant l'affichage pour éviter tout flash.
(function () {
  var pref = 'auto';
  try { pref = localStorage.getItem('freshlist-theme') || 'auto'; } catch (e) {}
  var dark = pref === 'dark' ||
    (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();

// Comme une appli : pas de zoom (pincement iOS, Ctrl + molette, Ctrl + +/-) ; double appui bloqué en CSS.
// Si la page est déjà zoomée (zoom conservé par Safari), on la remet à 100 % et on laisse dézoomer.
(function () {
  var vv = window.visualViewport;
  var zoomed = function () { return !!vv && vv.scale > 1.01; };
  var typing = function () {
    var a = document.activeElement;
    return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  };

  // Rejouer la balise viewport force iOS à revenir à l'échelle 1
  var resetting = false;
  function resetZoom() {
    if (resetting || !zoomed() || typing()) return;
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    resetting = true;
    var content = meta.getAttribute('content');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover');
    setTimeout(function () { meta.setAttribute('content', content); resetting = false; }, 60);
  }

  // Bloque le pincement seulement à 100 % : zoomé, l'utilisateur peut toujours dézoomer
  var block = function (e) { if (!zoomed()) e.preventDefault(); };
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    document.addEventListener(t, block, { passive: false });
  });
  document.addEventListener('gestureend', function () { setTimeout(resetZoom, 50); });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) block(e);
  }, { passive: false });
  document.addEventListener('touchend', function (e) {
    if (!e.touches || !e.touches.length) setTimeout(resetZoom, 50);
  });
  document.addEventListener('focusout', function () { setTimeout(resetZoom, 300); });
  document.addEventListener('DOMContentLoaded', resetZoom);
  window.addEventListener('pageshow', resetZoom);
  window.addEventListener('load', resetZoom);
  if (vv) vv.addEventListener('resize', function () { setTimeout(resetZoom, 150); });

  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0', 'Add', 'Subtract'].indexOf(e.key) !== -1) e.preventDefault();
  });
})();
