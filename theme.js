// Applique le thème (clair / sombre / auto) avant l'affichage pour éviter tout flash.
(function () {
  var pref = 'auto';
  try { pref = localStorage.getItem('freshlist-theme') || 'auto'; } catch (e) {}
  var dark = pref === 'dark' ||
    (pref === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
