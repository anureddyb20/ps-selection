# VVCE IDEATHON – PROBLEM STATEMENT SELECTION PORTAL

A complete, production-ready Problem Statement (PS) Selection Portal for **VVCE Ideathon 2026**, redesigned with a **cyber-operations command desk aesthetic** inspired by mission control logistics dashboards.

---

## ⚡ New User Flow – Team Login

The portal follows the required strict sequence:

$$\text{Team Login} \longrightarrow \text{Problem Statement Selection} \longrightarrow \text{Confirmation} \longrightarrow \text{Selection Success / Locked View}$$

- **No Public Self-Registration**: Only pre-authorized participating teams created or imported by administrators can log in.
- **Team Login Screen (`/`)**:
  - Centered dark panel with cyan accents and VVCE Ideathon branding.
  - Team ID and Password inputs with show/hide toggle.
  - Server-side password verification against cryptographically salted hashes.
  - Secure HTTP-only session cookie (`vvce_team_session`).
- **Team Dashboard (`IDEATHON // PROBLEM STATEMENT DESK`)**:
  - Shows logged-in Team ID, Team Name, and Domain.
  - If the team **has not selected** a PS: allows browsing domains and selecting an available code.
  - If the team **has already selected** a PS: showcases their locked selection with receipt printing; prevents any further selection across the entire portal.

---

## 🎨 Visual Language & Design System

Redesigned after the operations command desk reference layout:
- **Main Background**: Near-black (`#050608`)
- **Panel Background**: Deep charcoal (`#0B0C12`)
- **Card Background**: Dark graphite (`#10121A`)
- **Primary Accent**: Electric cyan (`#00E5F2`)
- **Secondary Accent**: Vivid magenta (`#FF007A`) for alerts and full states
- **Active Selection**: Warm yellow (`#FFD000`) with top-right glowing indicator dot
- **Success / Confirmed**: Controlled emerald green (`#10B981`)
- **Typography**: Clean monospaced accents, uppercase section labels, and high-contrast readable layouts.

---

## 🔒 Exact 30 PS Codes & Strict Slot Enforcement

- **CSE / AIML (15 Codes)**: `CS-01` to `CS-15`
- **Electronics & Communication (10 Codes)**: `EC-01` to `EC-10`
- **Mechanical & Civil (5 Codes total)**:
  - *Mechanical (3 Codes)*: `ME-01`, `ME-02`, `ME-03`
  - *Civil (2 Codes)*: `CE-01`, `CE-02`
- **Strict Privacy**: Teams see **ONLY the PS code** (e.g. `CS-01`), occupancy count (`0/2`, `1/2`, `2/2`), availability status, and selection button. Problem titles, descriptions, and case study details are strictly confidential and never exposed.
- **Two-Team Capacity Limit**: Max 2 teams per code. When `2/2` is reached, the code is locked and disabled. Enforced via database-level mutex locking.
- **One PS Per Team**: A team cannot select more than one code across the portal.

---

## 🔑 Pre-configured Credentials

### 1. Demo Team Accounts
| Team ID | Team Name | Domain | Password |
|---|---|---|---|
| `TEAM-101` | Neural Knights | CSE / AIML | `vvce@2026` |
| `TEAM-102` | CyberPulse | CSE / AIML | `vvce@2026` |
| `TEAM-103` | DataCrafters | CSE / AIML | `vvce@2026` |
| `TEAM-201` | Silicon Spark | Electronics & Comm | `vvce@2026` |
| `TEAM-202` | WaveRiders | Electronics & Comm | `vvce@2026` |
| `TEAM-301` | Titan Dynamics | Mechanical & Civil | `vvce@2026` |
| `TEAM-302` | TerraStructures | Mechanical & Civil | `vvce@2026` |

*Admins can create more team accounts or seed them directly from the Admin Portal.*

### 2. Organizer Admin Portal
- **URL**: `http://localhost:3000/admin`
- **Access Code**: `123654`

---

## 🚀 Running the Project

```bash
# 1. Run Development Server
npm run dev

# 2. Production Build & Start
npm run build
npm run start

# 3. Run Automated Verification Test Suite
npx tsx scripts/verify-all.ts
```

All 20 tests for authentication, capacity locking, race-condition safety, and admin controls pass with 0 errors.
