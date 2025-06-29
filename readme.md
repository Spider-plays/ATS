# ATS (Applicant Tracking System)

A full-stack Applicant Tracking System (ATS) built with React, Express, Drizzle ORM, and PostgreSQL (Supabase compatible).

## Features

- Candidate management
- Job requirements and pipeline
- Interview scheduling
- User management with roles (admin, manager, recruiter)
- Analytics dashboard

---

## Prerequisites

- **Node.js** v18 or higher
- **pnpm** (recommended)
- **Supabase** (or any PostgreSQL database)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ATS
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following:

```env
DATABASE_URL=your_supabase_postgres_url
```

- You can get this from your Supabase project dashboard under Database settings.

### 4. Database Setup

Run migrations and seed the database (optional):

```bash
pnpm db:push
pnpm exec tsx scripts/seed-db.ts
```

### 5. Run the App (Development)

```bash
pnpm dev
```

- The server will start on port 5000, or the next available port (e.g., 5001).
- Access the app at [http://localhost:PORT](http://localhost:PORT)

### 6. Build & Run (Production)

```bash
pnpm build
pnpm start
```

---

## Project Structure

- `client/` — React frontend
- `server/` — Express backend
- `shared/` — Shared schemas and types
- `scripts/` — Utility scripts (e.g., database seeding)

---

## Troubleshooting

- **Port already in use:** The app will automatically use the next available port if 5000 is taken. Check the terminal output for the port number.
- **Database errors:** Ensure your `DATABASE_URL` is correct and the database is accessible.
- **Missing dependencies:** Run `pnpm install` to ensure all packages are installed.

---

## License

MIT
