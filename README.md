# CarePlus – REST API (Warehouse management system)
This is a RESTful API built using Node.js, Fastify, PostgreSQL, and Prisma.
The API serves as the backend for the CarePlus inventory management system, a fictional pharmacy handling non-prescription medicines and healthcare products.

This document provides a detailed explanation of all available API endpoints, including request methods, routes, authentication requirements, request bodies, and descriptions of each endpoint’s responsibility.

The API handles user authentication, role-based access control, product and category management, stock handling, filtering/searching, and image uploads.

----

## Database structure

The API uses a relational PostgreSQL database accessed through Prisma ORM.

The following tables are defined and actively used:

- Users
- Categories
- Products

----

## Users

User accounts are registered using email and password and assigned a role that determines access rights.

```json
{
  "id": "integer (PK)",
  "email": "string",
  "password": "string (hashed)",
  "role": "'admin' | 'staff'",
  "createdAt": "DateTime"
}
```
Passwords are securely hashed using bcrypt before storage.
The default role is staff if no role is provided during registration.

* Admin users have full access to the system.
* Staff users have limited access, mainly for stock management and read-only operations.

Categories

Categories represent product groupings such as pain relief, cold medicine, or supplements.

```json
{
  "id": "integer (PK)",
  "name": "string",
  "description": "string"
}
```
Categories are used to organize products and support filtering in the client application.
