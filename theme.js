// Same light/dark switch as the original site (the .dark class), now remembered
// between visits. Loaded in <head> so the saved theme applies before first paint.
(function () {
  var root = document.documentElement;
  try {
    if (localStorage.getItem('darkMode') === 'dark') root.classList.add('dark');
  } catch (e) {}

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.dark-mode-btn');
    if (!btn) return;
    var sync = function () { btn.setAttribute('aria-pressed', root.classList.contains('dark')); };
    sync();
    btn.addEventListener('click', function () {
      root.classList.toggle('dark');
      sync();
      try { localStorage.setItem('darkMode', root.classList.contains('dark') ? 'dark' : 'light'); } catch (e) {}
    });
  });
})();
