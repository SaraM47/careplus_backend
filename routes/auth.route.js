// Import authentication controller functions
// register handles user account creation
// login handles user authentication and JWT issuing
const { register, login } = require("../controllers/auth.controller");

async function authRoutes(fastify) {
  // Route for user registration
  // Public endpoint, no JWT required
  fastify.post("/register", register);
  // Route for user login
  // Verifies credentials and returns JWT on success
  fastify.post("/login", login);
}

// Export route definition so it can be registered in server.js
module.exports = authRoutes;
