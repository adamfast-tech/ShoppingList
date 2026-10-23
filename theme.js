// Applique le thème (clair / sombre / auto) avant l'affichage pour éviter tout flash.
(function () {
  var pref = 'auto';
  try { pref = localStorage.getItem('freshlist-theme') || 'auto'; } catch (e) {}
  var dark = pref === 'dark' ||
    (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();

// Comme une appli : bloque le zoom (pincement iOS, Ctrl + molette, Ctrl + +/-) ; le double appui est bloqué en CSS (touch-action)
(function () {
  var block = function (e) { e.preventDefault(); };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) {
    document.addEventListener(t, block, { passive: false });
  });
  document.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0', 'Add', 'Subtract'].indexOf(e.key) !== -1) e.preventDefault();
  });
})();
