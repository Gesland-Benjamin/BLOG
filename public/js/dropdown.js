/**
 * Bootstrap conserve la gestion des clics, du clavier et de aria-expanded.
 * Le parent immobile sert de référence pour éviter que Popper ne suive
 * les transformations du bouton lors du survol ou du clic.
 */
(function () {
  function initDropdowns() {
    if (!window.bootstrap || !window.bootstrap.Dropdown) return;

    document.querySelectorAll('header [data-bs-toggle="dropdown"]').forEach(function (toggle) {
      window.bootstrap.Dropdown.getOrCreateInstance(toggle, {
        reference: 'parent'
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns, { once: true });
  } else {
    initDropdowns();
  }
})();
