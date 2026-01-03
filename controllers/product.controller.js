const prisma = require("../db/prisma");
const cloudinary = require("cloudinary").v2;

/**
 * Cloudinary configuration
 * Loads credentials from environment variables
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /products
 * Supports pagination, search and multiple filters
 */
async function getProducts(req, reply) {
  // Pagination parameters
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Optional filters from query parameters
  const q = req.query.q ? String(req.query.q).trim() : "";
  const categoryId = req.query.categoryId
    ? Number(req.query.categoryId)
    : undefined;
  const form = req.query.form ? String(req.query.form) : undefined;

  // Stock filter: true, false or undefined
  const inStock =
    req.query.inStock === "true"
      ? true
      : req.query.inStock === "false"
      ? false
      : undefined;

  // Price range filters
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

  // Prisma where object is built conditionally
  const where = {};

  // Full-text like search in name or description
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // Category filter
  if (categoryId) where.categoryId = categoryId;
  // Product form filter, case insensitive match
  if (form) where.form = { equals: form, mode: "insensitive" };
  // Stock state filter
  if (inStock === true) where.stock = { gt: 0 };
  if (inStock === false) where.stock = { equals: 0 };
  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Sorting the results
  const sort = req.query.sort || "createdAt_desc";

  const sortMap = {
    name_asc: { name: "asc" },
    name_desc: { name: "desc" },

    createdAt_asc: { createdAt: "asc" },
    createdAt_desc: { createdAt: "desc" },

    price_asc: { price: "asc" },
    price_desc: { price: "desc" },

    stock_asc: { stock: "asc" },
    stock_desc: { stock: "desc" },
  };

  const orderBy = sortMap[sort] || sortMap.createdAt_desc;

  // Fetch products with pagination and filters
  const products = await prisma.product.findMany({
    where,
    skip,
    take: limit,
    orderBy,
    include: { category: true },
  });

  // Count total for pagination metadata
  const total = await prisma.product.count({ where });

  reply.send({
    data: products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * POST /products
 * Creates a new product from request body
 */
async function createProduct(req, reply) {
  const product = await prisma.product.create({
    data: req.body,
  });

  reply.code(201).send(product);
}

/**
 * PUT /products/:id
 * Updates full product object by id
 */
async function updateProduct(req, reply) {
  const id = Number(req.params.id);

  const product = await prisma.product.update({
    where: { id },
    data: req.body,
  });

  reply.send(product);
}

/**
 * DELETE /products/:id
 * Deletes a product by id
 */
async function deleteProduct(req, reply) {
  const id = Number(req.params.id);

  await prisma.product.delete({
    where: { id },
  });

  reply.code(204).send();
}

/**
 * PATCH /products/:id/stock
 * Updates only inventory quantity
 * Supports absolute set or relative increment
 */
async function updateProductStock(req, reply) {
  const id = Number(req.params.id);
  const { delta, stock } = req.body;

  // Require at least one of the fields
  if (delta === undefined && stock === undefined) {
    return reply.code(400).send({
      message: "Provide either 'delta' or 'stock'",
    });
  }

  let updatedProduct;
  // Increment or decrement stock
  if (delta !== undefined) {
    updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: Number(delta),
        },
      },
    });
  }

  // Set stock to exact value
  if (stock !== undefined) {
    updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        stock: Number(stock),
      },
    });
  }

  reply.send(updatedProduct);
}

/**
 * POST /products/:id/image
 * Upload product image to Cloudinary
 * Saves returned secure URL in database
 */
async function uploadProductImage(req, reply) {
  const id = Number(req.params.id);

  // Receive file from multipart form-data
  const file = await req.file();
  if (!file) {
    return reply.code(400).send({ message: "No file uploaded" });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return reply.code(400).send({ message: "Invalid file type" });
  }

  // Upload to Cloudinary using data URI format
  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${(
      await file.toBuffer()
    ).toString("base64")}`,
    {
      folder: "careplus/products",
      public_id: `product_${id}_${Date.now()}`,
    }
  );

  // Save image URL in database
  const product = await prisma.product.update({
    where: { id },
    data: { imagePath: result.secure_url },
  });

  reply.send({
    message: "Image uploaded",
    imagePath: result.secure_url,
    product,
  });
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  uploadProductImage,
};
