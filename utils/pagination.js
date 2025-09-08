export function parsePagination(query) {
  const limit = Math.max(1, Math.min(100, parseInt(query.limit ?? '20', 10)));
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const skip = (page - 1) * limit;
  return { limit, page, skip };
}

export function buildPaginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}
