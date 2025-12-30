// Controller for user registration and login
const prisma = require('../db/prisma');
const bcrypt = require('bcrypt');

// Create and register a new user account by POST /auth/register
async function register(req, reply) {
    console.log("BODY:", req.body);
  const { email, password, role } = req.body || {}; // Destructure email, password, and role from request body

  // Validate required fields
  if (!email || !password) {
    return reply.code(400).send({
      message: 'email and password are required',
      received: { email, password: password ? '***' : undefined, role },
    });
  }

    // Check for existing user by email
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  // If user already exists, return conflict error so its prevent duplicate registration
  if (existing) {
    return reply.code(409).send({ message: 'Email already exists' });
  }

  // Hash password before storing in database
  const hashed = await bcrypt.hash(password, 10);

    // Create user with default role if none provided
  const user = await prisma.user.create({
    data: { email, password: hashed, role: role || 'staff' },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return reply.code(201).send(user); // Return created user with 201 status code
}

// Verify user credentials and issue JWT token by POST /auth/login
async function login(req, reply) {
  const { email, password } = req.body || {};

  // Validate required fields
  if (!email || !password) {
    return reply.code(400).send({ message: 'email and password are required' });
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return reply.code(401).send({ message: 'Invalid credentials' });

  // Compare provided password with stored hashed password
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return reply.code(401).send({ message: 'Invalid credentials' });

  // Generate JWT token with user ID and role
  const token = await reply.jwtSign({ sub: user.id, role: user.role });

  // Return token and public user info data
  return reply.send({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

module.exports = { register, login };
