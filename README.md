# CarePlus – REST API (Inventory management system)
This is a RESTful API built using Node.js, Fastify, PostgreSQL, and Prisma.
The API serves as the backend for the CarePlus inventory management system, a fictional pharmacy handling non-prescription medicines and healthcare products.

This document provides a detailed explanation of all available API endpoints, including request methods, routes, authentication requirements, request bodies, and descriptions of each endpoint’s responsibility.

The API handles user authentication, role-based access control, product and category management, stock handling, filtering/searching, and image uploads.

----

## Project repository

Backend application: CarePlus Backend (Render) [here](https://careplus-backend-6a90.onrender.com/).

Frontend repository: CarePlus Frontend (Vue SPA) [here](https://github.com/SaraM47/careplus-frontend).

Frontend application: Runs as a Vue Single Page Application consuming this API [here]().

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
  "id": "integer",
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

## Categories

Categories represent product groupings such as pain relief, cold medicine, or supplements.

```json
{
  "id": "integer",
  "name": "string",
  "description": "string"
}
```
Categories are used to organize products and support filtering in the client application.

## Products

Products represent items stored in the pharmacy inventory.
```json
{
  "id": "integer (PK)",
  "name": "string",
  "description": "string",
  "price": "number",
  "stock": "integer",
  "form": "string (tablet, capsule, liquid, etc.)",
  "imagePath": "string (Cloudinary URL)",
  "categoryId": "integer (FK → Category)",
  "createdAt": "DateTime",
  "updatedAt": "DateTime"
}
```
Each product belongs to one category.
Product images are stored externally using Cloudinary, and only the image URL is saved in the database.

----

## Authentication & security

Authentication is handled using JWT (JSON Web Tokens).

Protected routes require a valid token passed via:
```
Authorization: Bearer <token>
```
Role-based access control is enforced at route level.

## Authentication routes
| Method | Endpoint       | Body                  | Requires Auth | Description                            |
| ------ | -------------- | --------------------- | ------------- | -------------------------------------- |
| POST   | /auth/register | email, password, role | No            | Registers a new user account           |
| POST   | /auth/login    | email, password       | No            | Logs in a user and returns a JWT token |

## Category routes
| Method | Endpoint        | Body              | Requires Auth | Description              |
| ------ | --------------- | ----------------- | ------------- | ------------------------ |
| GET    | /categories     | –                 | Yes           | Retrieves all categories |
| POST   | /categories     | name, description | Yes (admin)   | Creates a new category   |
| PUT    | /categories/:id | name, description | Yes (admin)   | Updates a category       |
| DELETE | /categories/:id | –                 | Yes (admin)   | Deletes a category       |

## Product routes
### Full CRUD
| Method | Endpoint      | Body         | Requires Auth | Description                                            |
| ------ | ------------- | ------------ | ------------- | ------------------------------------------------------ |
| GET    | /products     | –            | Yes           | Retrieves products with pagination, search and filters |
| POST   | /products     | product data | Yes (admin)   | Creates a new product                                  |
| PUT    | /products/:id | product data | Yes (admin)   | Updates product information                            |
| DELETE | /products/:id | –            | Yes (admin)   | Deletes a product                                      |

### Stock management (dedicated endpoint)
| Method | Endpoint            | Body           | Requires Auth      | Description                 |
| ------ | ------------------- | -------------- | ------------------ | --------------------------- |
| PATCH  | /products/:id/stock | delta or stock | Yes (admin, staff) | Updates product stock level |

Example request body:

```json
{
  "delta": -5
}
```

or
```json
{
  "stock": 100
}
```

----

## Search, filter & pagination
The product endpoint supports advanced querying via query parameters for example:
```
/products?page=1&limit=10
/products?q=vitamin
/products?categoryId=3
/products?form=tablet
/products?inStock=true
/products?minPrice=50&maxPrice=200
/products?sort=price&order=asc
```

All filters can be combined, and pagination metadata is returned with every response.

## Image upload
Product images are uploaded using multipart/form-data and stored in Cloudinary.
| Method | Endpoint            | Requires Auth | Description                                       |
| ------ | ------------------- | ------------- | ------------------------------------------------- |
| POST   | /products/:id/image | Yes (admin)   | Uploads an image and associates it with a product |

* Accepted file types: jpg, png, webp. The response contains a public Cloudinary URL saved in imagePath.

----

## Roles and access Control
The API distinguishes between two user roles:

### Admin
* Full CRUD access to products and categories
* Can upload product images
* Can manage stock
* Full system access

### Staff
* Read-only access to products and categories
* Can update product stock
* Cannot create, update, or delete products or categories

----

## Testing

The API was tested using Postman, but it can be tested similar REST clients.
When calling protected routes, include a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```
---

## Getting started (local setup)
1. Clone the repository
```
git clone https://github.com/<your-username>/careplus_backend.git
cd careplus_backend
```

2. Install dependencies
```
npm install
```

3. Environment variables
Create a .env file in the project root and add the following environment variables:
```
DATABASE_URL=postgresql://username:password@localhost:5432/careplus_db
JWT_SECRET=your_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

These variables are required for:
- Database connection (PostgreSQL)
- JWT authentication
- Image uploads via Cloudinary

4. Database setup
Run Prisma migrations to create the database tables:
```
npx prisma migrate dev
```

5. Start the server
```
npm start
```
The API will now be running at:
```
http://localhost:5000
```
