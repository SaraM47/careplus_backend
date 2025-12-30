const Fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const multipart = require("@fastify/multipart");

const productRoutes = require("./routes/product.route");
const categoryRoutes = require("./routes/category.route");
const authRoutes = require("./routes/auth.route");

const fastify = Fastify({ logger: true });

/**
 * CORS
 * Allows requests from the frontend (Vue SPA)
 */
fastify.register(cors, {
  origin: true,
});

/**
 * JWT plugin used for authentication, register and login
 */
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "dev_secret_change_me",
});

/**
 * Multipart is used for file image uploads (product images)
 */
fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/**
 * Auth hook for protected routes which requires a valid JWT token
 */
fastify.decorate("auth", async (req, reply) => {
    try {
      const decoded = await req.jwtVerify();
      req.user = decoded; 
    } catch (err) {
      reply.code(401).send({ message: "Unauthorized" });
    }
  });
  
  /**
   * Role-based access control is used to protect routes based on user roles, which requires authentication to already be executed
   */
  fastify.decorate("requireRole", (roles) => {
    return async (req, reply) => {
      if (!req.user) {
        return reply.code(401).send({ message: "Unauthorized" });
      }
  
      if (!roles.includes(req.user.role)) {
        return reply.code(403).send({ message: "Forbidden" });
      }
    };
  });  

/**
 * Root route is used by browser / Render to confirm API is running
 */
fastify.get("/", async () => {
  return {
    status: "ok",
    service: "CarePlus API",
    environment: process.env.NODE_ENV || "development",
  };
});

/**
 * Routes
 * /auth for authentication login and registration (public)
 * /categories for cateqgory management (protected)
 * /products for product management (protected)
 */
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(categoryRoutes, { prefix: "/categories" });
fastify.register(productRoutes, { prefix: "/products" });

/**
 * Start server
 */
const port = process.env.PORT || 5000;

fastify.listen({ port, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Backend running on port ${port}`);
});