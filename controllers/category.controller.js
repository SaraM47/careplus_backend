const prisma = require("../db/prisma");

/**
 * GET /categories for listing categories, with pagination and filters
 */
async function getCategories(req, reply) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  // Optional text search on name/description

  const q = req.query.q ? String(req.query.q).trim() : "";
  // Filter categories based on whether they have products or not
  // hasProducts=true means categories with at least one product
  // hasProducts=false means categories with no products
  const hasProducts =
    req.query.hasProducts === "true"
      ? true
      : req.query.hasProducts === "false"
      ? false
      : undefined;
  // Sorting field and order, default sort by id DESC

  const sort = req.query.sort ? String(req.query.sort) : "id";
  const order = req.query.order === "asc" ? "asc" : "desc";

  // Build Prisma where object dynamically
  const where = {};

  // Search filter on name and description (case insensitive)
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

    // Filter categories that have at least one product
  if (hasProducts === true) {
    where.products = { some: {} };
  }

    // Filter categories that have no products
  if (hasProducts === false) {
    where.products = { none: {} };
  }

    // Dynamic orderBy based on query params
  const orderBy = {};
  orderBy[sort] = order;

    // Fetch categories and total count in parallel
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { products: true } }, // Include count per category
      },
    }),
    prisma.category.count({ where }),
  ]);

    // Standard API response with meta for pagination

  reply.send({
    data: categories,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * POST /categories which creates a new category
 */
async function createCategory(req, reply) {
  const { name, description } = req.body;

  const category = await prisma.category.create({
    data: { name, description },
  });

  reply.code(201).send(category);
}

/**
 * PUT /categories/:id which updates with desscription category by id
 */
async function updateCategory(req, reply) {
  const id = Number(req.params.id);
  const { name, description } = req.body;

  const category = await prisma.category.update({
    where: { id },
    data: { name, description },
  });

  reply.send(category);
}

/**
 * DELETE /categories/:id which deletes a category by id
 */
async function deleteCategory(req, reply) {
  const id = Number(req.params.id);

  await prisma.category.delete({ where: { id } });
  reply.code(204).send();
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
