/**
 * Gestion des dropdowns en CSS pur
 * Ce script gère les interactions des dropdowns sans dépendre de Bootstrap
 */

/**
 * Gestion des dropdowns en CSS pur
 * Ce script gère les interactions des dropdowns sans dépendre de Bootstrap
 */

function initDropdownHandlers() {
  // Délégation des clics pour gérer proprement les dropdowns
  document.addEventListener('click', function(e) {
    const toggle = e.target.closest('.dropdown-toggle');

    if (toggle) {
      e.preventDefault();

      // Trouver le menu associé
      let parentDropdown = toggle.closest('.dropdown');
      let menu = null;
      if (parentDropdown) menu = parentDropdown.querySelector('.dropdown-menu');
      if (!menu) {
        const next = toggle.nextElementSibling;
        if (next && next.classList && next.classList.contains('dropdown-menu')) menu = next;
      }

      if (menu) {
        const isShown = menu.classList.contains('show');

        // Fermer les autres menus ouverts
        document.querySelectorAll('.dropdown-menu.show').forEach(function(m) {
          if (m !== menu) {
            m.classList.remove('show');
            const btn = m.previousElementSibling;
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        });

        // Basculer le menu actuel
        if (isShown) {
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('show');
          toggle.setAttribute('aria-expanded', 'true');
        }
      }

      return; // on a géré le clic
    }

    // Clic en dehors: fermer tous les menus
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        const btn = menu.previousElementSibling;
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

// Initialiser immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDropdownHandlers);
} else {
  initDropdownHandlers();
}
  
  // Gérer les accordéons (comportement non-bootstrap si utilisé)
  const accordionButtons = document.querySelectorAll('.accordion-button');

  accordionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();

      const target = this.getAttribute('data-bs-target');
      if (target) {
        const collapse = document.querySelector(target);
        if (collapse) {
          const isShown = collapse.classList.contains('show');

          // Fermer les autres accordéons du même groupe
          const parent = this.closest('.accordion');
          if (parent) {
            parent.querySelectorAll('.accordion-collapse.show').forEach(c => {
              if (c !== collapse) {
                c.classList.remove('show');
              }
            });
          }

          // Toggle le collapse courant
          if (isShown) {
            collapse.classList.remove('show');
            this.classList.add('collapsed');
          } else {
            collapse.classList.add('show');
            this.classList.remove('collapsed');
          }
        }
      }
    });
  });
  
  // Gérer les alertes dismissibles
  const closeButtons = document.querySelectorAll('.alert .btn-close');
  
  closeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const alert = this.closest('.alert');
      if (alert) {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }
    });
  });
});

// Ajouter l'animation fadeOut au CSS si elle n'existe pas
if (!document.querySelector('style[data-dropdown-styles]')) {
  const style = document.createElement('style');
  style.setAttribute('data-dropdown-styles', 'true');
  style.textContent = `
    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-10px);
      }
    }
  `;
  document.head.appendChild(style);
}
