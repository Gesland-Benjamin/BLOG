/**
 * Gestion des dropdowns en CSS pur
 * Ce script gère les interactions des dropdowns sans dépendre de Bootstrap
 */

document.addEventListener('DOMContentLoaded', function() {
  // Gérer les dropdowns
  const dropdownToggles = document.querySelectorAll('[data-bs-toggle="dropdown"]');
  
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const menu = this.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        const isShown = menu.classList.contains('show');
        
        // Fermer tous les autres menus
        document.querySelectorAll('.dropdown-menu.show').forEach(m => {
          if (m !== menu) {
            m.classList.remove('show');
            const btn = m.previousElementSibling;
            if (btn) btn.setAttribute('aria-expanded', 'false');
          }
        });
        
        // Toggle le menu courant
        if (isShown) {
          menu.classList.remove('show');
          this.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('show');
          this.setAttribute('aria-expanded', 'true');
        }
      }
    });
  });
  
  // Fermer les dropdowns quand on clique ailleurs
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        const btn = menu.previousElementSibling;
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
  
  // Gérer les accordéons
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
