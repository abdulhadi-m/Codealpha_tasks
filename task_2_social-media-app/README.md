## SocialSpark - Social Media Platform

Built for my CodeAlpha web development internship (Task 2).

A simple social media app where users can post, like, comment, and follow each other.

## Tech Used
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express.js
- Auth: JWT + bcryptjs
- Storage: JSON flat files

## Features
- Register and login with JWT auth
- Create and delete posts
- Like and unlike posts
- Comment on posts
- User profiles with bio
- Follow and unfollow users

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