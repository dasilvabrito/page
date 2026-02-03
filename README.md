# Law Firm CRM & Automation Platform

A comprehensive CRM and handling system for Law Firms, featuring:
- Client Management & Intake
- Case/Deal Pipeline (Kanban)
- Document Generation & Management
- **Automated PJE/PDPJ Scraper**: Automatically fetches publications from the court portal.
- **Publication Management**: Deduplicates, tracks, and converts publications into actionable tasks.

## Structure

- **client/**: React + Vite + TailwindCSS frontend.
- **server/**: Node.js + Express + SQLite backend.
- **database/**: Local SQLite database storage.
- **uploads/**: Document storage.

## Prerequisites

- Node.js (v18+)
- NPM

## Setup

1. Install dependencies:
   ```bash
   cd server
   npm install
   
   cd ../client
   npm install
   ```

2. Configure Environment:
   - Ensure `server/db.js` points to the correct database path (default: `../database/crm.sqlite`).
   - The system uses local storage for simplicity.

3. Run the Application:
   You need to run both client and server terminals.

   **Terminal 1 (Backend):**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 (Frontend):**
   ```bash
   cd client
   npm run dev
   ```

4. Access:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

## Features

- **PJE Integration**: Scrapes publications using Puppeteer. 
  - *Note*: Requires manual login on first run; session is persisted via `cookies.json` and `session_storage.json` (ignored in git).
- **Unique IDs**: Publications are hashed (SHA-256) to prevent duplicates.
- **Safe Delete**: "Soft" deletion logic (or hard delete if configured) for publications.

## Security

- `.gitignore` is configured to exclude database files, session cookies, and uploads.
- **Do not commit** `server/cookies.json` or `database/*.sqlite` to public repositories.

## License

Private.
