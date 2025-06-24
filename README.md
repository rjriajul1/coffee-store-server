# ☕ Coffee Store Server

## 📝 Overview
This is the backend server for the Coffee Store website built using **Node.js**, **Express**, and **MongoDB**. It handles all coffee-related operations such as managing coffee inventory, user data, and order placement.

## 🚀 Tech Stack
- Node.js
- Express.js
- MongoDB
- Firebase Admin (JWT auth)
- CORS
- Dotenv

---

## 📁 API Endpoints

🔗 [Live Server URL](https://your-server-url.com)

### 📦 Coffee Endpoints

| Method | Endpoint                | Description                         |
|--------|-------------------------|-------------------------------------|
| GET    | `/coffees`              | Get all coffee items                |
| GET    | `/coffees/:id`          | Get a single coffee by ID           |
| GET    | `/coffeesByEmail?email=`| Get coffees by user email (JWT)     |
| POST   | `/coffees`              | Add a new coffee item               |
| PUT    | `/coffees/:id`          | Update a coffee by ID               |
| DELETE | `/coffees/:id`          | Delete a coffee by ID               |
| PATCH  | `/like/:coffeeId`       | Like or Dislike a coffee by email   |

---

### 🛒 Order Endpoints

| Method | Endpoint                    | Description                                  |
|--------|-----------------------------|----------------------------------------------|
| POST   | `/order-place/:coffeeId`    | Place an order (reduces quantity)            |
| GET    | `/my-orders/:email`         | Get orders placed by a user (JWT secured)    |

---

### 👤 User Endpoints

| Method | Endpoint     | Description                         |
|--------|--------------|-------------------------------------|
| GET    | `/users`     | Get all registered users            |
| POST   | `/users`     | Add/register a new user             |
| PATCH  | `/users`     | Update user lastSignInTime          |
| DELETE | `/users/:id` | Delete a user by ID                 |

---

## 🔐 JWT Protected Routes
- `GET /coffeesByEmail`
- `GET /my-orders/:email`

🔸 These routes require a valid JWT token in the request headers:

git clone https://github.com/rjriajul1/coffee-store-server.git
cd coffee-store-server
npm install
npm run dev

