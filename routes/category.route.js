// Routes for managing categories with role-based access control
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

// Global hook for all category routes
// Requires valid JWT for every request in this router
async function categoryRoutes(fastify) {
  fastify.addHook("preHandler", fastify.auth);

  // List all categories, available to any authenticated user
  fastify.get("/", getCategories);

  // Create new category, admin only

  fastify.post(
    "/",
    { preHandler: fastify.requireRole(["admin"]) },
    createCategory
  );

  // Update existing category, admin only
  fastify.put(
    "/:id",
    { preHandler: fastify.requireRole(["admin"]) },
    updateCategory
  );

  // Delete category, admin only
  fastify.delete(
    "/:id",
    { preHandler: fastify.requireRole(["admin"]) },
    deleteCategory
  );
}

module.exports = categoryRoutes;
