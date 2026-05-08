// =========================
// PARAMS PAGINATION (OFFSET / LIMIT)
// =========================
export const getPaginationParams = (page = 1, pageSize = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.max(1, parseInt(pageSize) || 10);
  const offset = (pageNum - 1) * limit;

  return {
    offset,
    limit,
    page: pageNum,
    pageSize: limit
  };
};

// =========================
// DATA PAGINATION POUR EJS
// =========================
export const createPaginationData = (
  total,
  page,
  pageSize,
  baseUrl = '',
  pageParam = 'page'
) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = Math.max(1, parseInt(pageSize) || 10);
  const totalPages = Math.ceil(total / limit);

  const currentPage = Math.min(pageNum, totalPages || 1);

  const pageNumbers = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push({
      number: i,
      isActive: i === currentPage,
      url: `${baseUrl}?${pageParam}=${i}`
    });
  }

  return {
    current: currentPage,
    total: totalPages,
    pageSize: limit,
    total_items: total,
    has_previous: currentPage > 1,
    has_next: currentPage < totalPages,
    previous_url: currentPage > 1 ? `${baseUrl}?${pageParam}=${currentPage - 1}` : null,
    next_url: currentPage < totalPages ? `${baseUrl}?${pageParam}=${currentPage + 1}` : null,
    pages: pageNumbers,
    start_item: (currentPage - 1) * limit + 1,
    end_item: Math.min(currentPage * limit, total)
  };
};