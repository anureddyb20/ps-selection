# VICE VERSE – PROBLEM STATEMENT SELECTION PORTAL

A complete, production-ready Problem Statement (PS) Selection Portal for **Vice Verse 2026**, built with **Next.js 14 App Router, TypeScript, and Tailwind CSS**.

The interface is styled in a **pure black, white, and vibrant magenta (#FF007F)** visual theme with bold geometric typography and dark paneling.

---

## ⚡ User Flow – Team Identification & PS Selection

$$\text{Team ID Entry} \longrightarrow \text{Domain PS Browsing} \longrightarrow \text{Confirmation Dialog} \longrightarrow \text{Locked Receipt View}$$

- **Single Team Identifier Lookup**: Teams enter their registered Team ID directly (no password friction). Teams are authenticated dynamically.
- **Strict Privacy**: Participating teams see **ONLY the PS code** (e.g. `CS-01`), occupancy count (`0/2`, `1/2`, `2/2`), and selection availability.
- **Two-Team Capacity Limit**: Max 2 teams per code. When `2/2` is reached, the code is locked and disabled. Enforced via database-level atomic locking.
- **One PS Per Team**: Each team can select only ONE problem statement. Once confirmed, the catalog is locked and hidden, showing the permanent confirmation receipt.
- **Zero Browser Popups**: All alerts and confirmation dialogs render in the UI/UX design language.

---

## 🔒 Exact 30 PS Codes Inventory

- **CSE / AIML (15 Codes)**: `CS-01` to `CS-15`
- **Electronics & Communication (10 Codes)**: `EC-01` to `EC-10`
- **Mechanical & Civil (5 Codes total)**:
  - *Mechanical (3 Codes)*: `ME-01`, `ME-02`, `ME-03`
  - *Civil (2 Codes)*: `CE-01`, `CE-02`

---

## 🛡️ Organizer Admin Desk (`/admin`)

- **Secure Access Key**: Protected by organizer access code (`123654`).
- **Telemetry & Live Selections**: Real-time overview of occupied and available slots.
- **Inventory Control**: Real-time toggle of PS code visibility and selection state.
- **Export Capabilities**: One-click export to CSV and Excel.
- **Slot Management**: Custom modal to cancel or manually assign problem statement slots.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run automated verification suite
npx tsx scripts/verify-all.ts

# Build production bundle
npm run build
npm run start
```
