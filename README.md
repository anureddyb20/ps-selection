# VVCE IDEATHON – PROBLEM STATEMENT SELECTION PORTAL

A complete, production-ready web application built for the **Vidyavardhaka College of Engineering (VVCE) Ideathon 2026**.

Participating teams can explore available Problem Statement (PS) codes across engineering domains and reserve their preferred PS code. To ensure competitive fairness, **each PS code has a strict maximum capacity of TWO teams only**. Once 2 teams select a code, it is locked immediately.

The portal also features a separate, secure **Admin Portal (`/admin`)** with statistics, PS code management, team management, selection management, and export functionality (CSV & Excel).

---

## 🚀 Key Specifications & Strict Rule Enforcement

1. **NO VITE**: Built strictly with **Next.js 14 (App Router)**, React 18, TypeScript, and Tailwind CSS.
2. **Display ONLY PS Codes**: Participating teams see **ONLY the PS codes** (e.g. `CS-01`, `EC-01`, `ME-01`, `CE-01`), occupied count (e.g., `0/2`, `1/2`, `2/2`), status (`AVAILABLE`, `ONE SLOT LEFT`, `FULL`), and selection button. Problem statement titles, descriptions, org names, and case study details are strictly confidential and never exposed.
3. **Exact 30 PS Codes**: Initialized from the official case study distribution:
   - **CSE / AIML (15 Codes)**: `CS-01` to `CS-15`
   - **Electronics and Communication (10 Codes)**: `EC-01` to `EC-10`
   - **Mechanical and Civil (5 Codes total)**:
     - *Mechanical (3 Codes)*: `ME-01`, `ME-02`, `ME-03`
     - *Civil (2 Codes)*: `CE-01`, `CE-02`
4. **Database-Level Two-Team Limit**:
   - `0/2` – **AVAILABLE** (Slot 1 and Slot 2 open)
   - `1/2` – **ONE SLOT LEFT** (Only 1 slot left)
   - `2/2` – **FULL** (Immediately locked, button disabled)
   - Enforced atomically with mutex locking in PostgreSQL/database to prevent race conditions.
5. **Strict One-PS-Per-Team**: Validated across Team Name, Team Registration ID, and Leader Email.
6. **Secure Admin Authentication**:
   - URL: `/admin`
   - Configured Access Code: `123654`
   - Secure server-side validation with cryptographic HTTP-only session cookies.
   - Access code is never exposed in client bundles or public APIs.
7. **Real-time Synchronization**:
   - Supports both **Supabase Realtime** and integrated **Server-Sent Events (SSE)** at `/api/realtime`.
   - When a slot is claimed, other connected users' screens and the admin dashboard update instantaneously without manual refresh.
8. **Export Capabilities**: Full export of registered teams and selections to **CSV** and **Excel (.xls)** formats.

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── .env.local                # Local environment configuration
├── package.json              # Next.js 14, React 18, Tailwind CSS, lucide-react
├── tsconfig.json             # TypeScript configuration with @/* path aliases
├── tailwind.config.js        # VVCE Ideathon custom theme & glassmorphism
├── scripts/
│   └── verify-all.ts         # Automated 22-test verification test runner
├── supabase/
│   └── schema.sql            # Full PostgreSQL schema, RLS policies, & atomic function
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with metadata
│   │   ├── globals.css       # Custom scrollbars, glassmorphism, animations
│   │   ├── page.tsx          # Public Portal (Hero, Domain Cards, PS Grid, Modals)
│   │   ├── admin/
│   │   │   └── page.tsx      # Organizer Dashboard (Stats, PS Mgmt, Teams, Selections, Controls)
│   │   └── api/
│   │       ├── ps-codes/     # Sanitized public PS codes endpoint
│   │       ├── reserve/      # Atomic reservation endpoint
│   │       ├── admin/        # Admin auth and management actions
│   │       ├── export/       # CSV and Excel export endpoint
│   │       └── realtime/     # Server-Sent Events (SSE) stream for live sync
│   ├── components/
│   │   ├── Navbar.tsx        # Event header and portal status
│   │   ├── Hero.tsx          # Hero banner with slot counters and rules
│   │   ├── DomainFilter.tsx  # 3 Domain selection cards with slot progress bars
│   │   ├── PSCard.tsx        # Problem Statement card (Code, count, status, button)
│   │   ├── RegistrationModal.tsx # Multi-step team registration form & review
│   │   ├── SuccessReceiptModal.tsx # Confirmation receipt with confetti
│   │   └── Footer.tsx        # College details & navigation
│   └── lib/
│       ├── types.ts          # TypeScript interfaces & types
│       ├── constants.ts      # Exactly 30 predefined PS codes & domain metadata
│       ├── auth.ts           # Cryptographic server-side admin authentication
│       ├── db.ts             # ACID transactional store & real-time event bus
│       └── supabase.ts       # Supabase client helper
```

---

## 🛠️ Getting Started

### 1. Installation
Dependencies are already configured. If reinstalling:
```bash
npm install
```

### 2. Environment Configuration
Create or inspect `.env.local`:
```env
PORT=3000
NODE_ENV=development

# Admin Access Code (Server-side ONLY)
ADMIN_ACCESS_CODE=123654
ADMIN_JWT_SECRET=super_secret_vvce_ideathon_admin_session_key_2026

# Optional: Supabase PostgreSQL (leave empty to use the built-in high-performance atomic store)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Running in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Running Production Build
```bash
npm run build
npm run start
```

---

## 🛡️ Admin Portal Guide

- Navigate to: **`http://localhost:3000/admin`**
- Enter the configured organizer access code: **`123654`**
- Available features:
  - **Dashboard Overview**: Total PS codes (30), registered teams, successful selections, available codes, partially booked, fully booked, and domain-wise breakdown with progress bars.
  - **PS Code Management**: View all 30 codes, publish/unpublish individual codes, pause/open selection per code, and inspect assigned teams.
  - **Team Management**: Real-time list of all registered teams with search, domain filter, and slot cancellation. Export to **CSV** or **Excel** with one click.
  - **Selection Records**: View timestamps and manual assignment modal to assign teams to open slots.
  - **Portal Controls**: Global toggle to publish/unpublish portal or pause/open submissions. Danger zone to reset all selections.

---

## 🗄️ Supabase PostgreSQL Setup (Optional)

The application includes `supabase/schema.sql`. To connect to a live Supabase project:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Paste the entire content of `supabase/schema.sql` and click **Run**.
3. Add your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

---

## 🧪 Automated Verification Suite

Run the automated verification suite covering all 24 project requirements:
```bash
npx tsx scripts/verify-all.ts
```

All 22 backend, race condition, atomic capacity, duplicate prevention, and admin authentication tests run and pass cleanly with 0 errors.

