/**
 * Utility pour gérer la pagination
 */

/**
 * Calcule les paramètres de pagination
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} pageSize - Nombre d'éléments par page
 * @returns {object} { offset, limit, page, pageSize }
 */
export const getPaginationParams = (page = 1, pageSize = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.max(1, parseInt(pageSize) || 10);
  const offset = (pageNum - 1) * limit;
  
  return { offset, limit, page: pageNum, pageSize: limit };
};

/**
 * Crée un objet pagination pour la vue
 * @param {number} total - Nombre total d'éléments
 * @param {number} page - Numéro de page actuelle
 * @param {number} pageSize - Nombre d'éléments par page
 * @param {string} baseUrl - URL de base pour les liens de pagination
 * @returns {object} Objet pagination pour la vue EJS
 */
export const createPaginationData = (total, page, pageSize, baseUrl = '') => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.max(1, parseInt(pageSize) || 10);
  const totalPages = Math.ceil(total / limit);
  
  // Limiter le numéro de page
  const currentPage = Math.min(pageNum, totalPages || 1);
  
  // Générer les numéros de pages à afficher (max 5 pages visibles)
  const pageNumbers = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push({
      number: i,
      isActive: i === currentPage,
      url: `${baseUrl}?page=${i}`
    });
  }
  
  return {
    current: currentPage,
    total: totalPages,
    pageSize: limit,
    total_items: total,
    has_previous: currentPage > 1,
    has_next: currentPage < totalPages,
    previous_url: currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : null,
    next_url: currentPage < totalPages ? `${baseUrl}?page=${currentPage + 1}` : null,
    pages: pageNumbers,
    start_item: (currentPage - 1) * limit + 1,
    end_item: Math.min(currentPage * limit, total)
  };
};
