// Prisma Client setup for database interactions
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

/**
 * Initialize Prisma Client instance to handle all database queries across the application
 */
const prisma = new PrismaClient();

// Export the Prisma Client instance for use in other modules
module.exports = prisma;
