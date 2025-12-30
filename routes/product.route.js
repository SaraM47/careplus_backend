// Product related routes
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  uploadProductImage,
} = require("../controllers/product.controller");

/**
 * Validation schemas for Fastify
 * Used to validate incoming request bodies
 */
const createProductSchema = {
  body: {
    type: "object",
    required: ["name", "price", "stock", "categoryId"],
    properties: {
      name: { type: "string", minLength: 2 },
      description: { type: "string" },
      price: { type: "number", minimum: 0 },
      stock: { type: "integer", minimum: 0 },
      form: { type: "string" },
      imagePath: { type: "string" },
      categoryId: { type: "integer" },
    },
  },
};

// Schema for updating product information
const updateProductSchema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 2 },
      description: { type: "string" },
      price: { type: "number", minimum: 0 },
      stock: { type: "integer", minimum: 0 },
      form: { type: "string" },
      imagePath: { type: "string" },
      categoryId: { type: "integer" },
    },
    additionalProperties: false,
  },
};

// Schema for updating product stock (either absolute or delta)
const updateStockSchema = {
  body: {
    type: "object",
    oneOf: [
      // Option 1: change stock by delta, for example +3 or -2
      {
        required: ["delta"],
        properties: {
          delta: { type: "integer" },
        },
        additionalProperties: false,
      },
      // Option 2: set stock to an exact value
      {
        required: ["stock"],
        properties: {
          stock: { type: "integer", minimum: 0 },
        },
        additionalProperties: false,
      },
    ],
  },
};

// Protect product routes with JWT authentication per route
// Not a global hook to avoid affecting /auth routes
async function productRoutes(fastify) {
  /**
   * Accessible by any authenticated user
   * Both admin and staff can read product list
   */
  fastify.get("/", { preHandler: fastify.auth }, getProducts);

  /**
   * Only admin users can create new products
   */
  fastify.post(
    "/",
    {
      preHandler: [fastify.auth, fastify.requireRole(["admin"])],
      schema: createProductSchema,
    },
    createProduct
  );

  // Only admin users can update product details
  fastify.put(
    "/:id",
    {
      preHandler: [fastify.auth, fastify.requireRole(["admin"])],
      schema: updateProductSchema,
    },
    updateProduct
  );

  /**
   * Admin and staff users can adjust stock levels
   * Dedicated endpoint focused on inventory management
   */
  fastify.patch(
    "/:id/stock",
    {
      preHandler: [fastify.auth, fastify.requireRole(["admin", "staff"])],
      schema: updateStockSchema,
    },
    updateProductStock
  );

  /**
   * Upload product image and associate it with product
   * Supports Cloudinary or other storage providers
   */
  fastify.post(
    "/:id/image",
    { preHandler: [fastify.auth, fastify.requireRole(["admin"])] },
    uploadProductImage
  );

  // Only admin users can delete products
  fastify.delete(
    "/:id",
    { preHandler: [fastify.auth, fastify.requireRole(["admin"])] },
    deleteProduct
  );
}

module.exports = productRoutes;
