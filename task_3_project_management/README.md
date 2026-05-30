# ProjectFlow — Project Management Tool

ProjectFlow is a clean, collaborative project management application built for the CodeAlpha web development internship program (Task 3). It allows teams to create group projects, manage tasks on a kanban-style board, assign tasks to team members, and communicate through comments directly inside task cards.

## 🚀 Features

- **User Authentication:** Secure registration and login using stateless JWT tokens.
- **Project Boards:** Create group project spaces that display task cards across 3 custom columns.
- **Kanban Flow:** Organize tasks efficiently into "To Do", "In Progress", and "Done" columns.
- **Task Assignment:** Assign responsibilities directly to verified project members.
- **Task Comments:** In-app communications thread localized within each individual task card.

## 🛠️ Tech Stack

- **Frontend:** Pure HTML5, Custom CSS3 Variables, Vanilla JavaScript (No frameworks or external UI libraries used).
- **Backend:** Node.js, Express.js (Express 5 Routing Pipeline).
- **Authentication:** jsonwebtoken (JWT), bcryptjs password hashing.
- **Database:** Local JSON Flat-Files (Lightweight, human-readable data arrays).

## How to Run

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file:
```
PORT=8081
JWT_SECRET=anyrandomstring
USE_MONGO=false 
```
4. Run `npm run dev`
5. Open `http://localhost:8081/auth.html`
