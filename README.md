# Amazon Clone – Fullstack Assignment (Scaler)

This project is a **fullstack Amazon-like e‑commerce application** built as part of the **Scaler SDE Intern – Fullstack Assignment**.

It demonstrates **frontend + backend integration**, basic e‑commerce flows, and clean component/API design.

---

## Tech Stack

### Frontend
- React (CRA)
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- MySQL

---

## Features Implemented

### Product Listing
- Grid-based product listing
- Product image, name, category, price
- Search by product name
- Filter by category

### Product Detail Page
- Product detail view with image carousel
- Price and stock status
- Add to Cart & Buy Now functionality

### Cart
- Add products to cart
- Update product quantity
- Remove products from cart
- Cart total calculation

### Checkout & Orders
- Shipping address input
- Order summary
- Order placement via backend API
- Order confirmation screen
- Order history view

---

## Project Structure

```
Project/
│
├── backend/
│   └── main.py        # FastAPI backend, DB models & APIs
│
└── frontend/
    └── src/
        ├── App.js
        ├── ProductCard.jsx
        ├── CartItem.jsx
        ├── Header.jsx 
        └── App.css
```

---

## Backend APIs

- `GET /api/products` – Fetch all products  
- `GET /api/products/{id}` – Fetch single product  
- `POST /api/checkout` – Place an order  
- `GET /api/orders` – Fetch all orders  
- `GET /api/orders/{id}` – Fetch order details  

> Note: Order total is recomputed on the backend for safety.  
> Stock validation can be extended for production use.

---

## How to Run the Project

### Backend Setup
1. Create a MySQL database:
   ```sql
   CREATE DATABASE amazon_clone;
   ```

2. Update database credentials in `main.py` if required.

3. Install dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy pymysql
   ```

4. Run the backend:
   ```bash
   uvicorn main:app --reload
   ```

Backend runs on: `http://localhost:8000`

---

### Frontend Setup
1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the app:
   ```bash
   npm start
   ```

Frontend runs on: `http://localhost:3000`

---

## Assumptions & Notes
- Authentication is **not implemented** (single default user assumed).
- This is a **time‑boxed assignment**, not production-ready software.
- CORS is enabled for local development.
- Sample products should be inserted manually or via a seed script.

---

## Possible Improvements
- Server-side stock locking & atomic transactions
- Authentication & user accounts
- Wishlist & notifications
- Automated tests for backend APIs
- Docker & deployment setup

---

## Author
**Prashanna Kumar Yadav**  
Scaler SDE Intern Assignment