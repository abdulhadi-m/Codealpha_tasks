## ShopSwift - E-Commerce Store 

Built this as part of my CodeAlpha web development internship (Task 1).

It's a full-stack e-commerce site where users can browse products, add them 
to a cart, register/login, and place orders.

## Tech Used
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express.js
- Auth: JWT + bcryptjs
- Storage: JSON flat files (no database setup needed)

## Features
- Product listings with search and filter
- Product detail modal
- Shopping cart (localStorage)
- User registration and login
- Order placement with live status updates
- Order history page

## How to Run

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file:
```
PORT=5000
JWT_SECRET=anyrandomstring
USE_MONGO=false
```
4. Run `npm run dev`
5. Open `http://localhost:5000`