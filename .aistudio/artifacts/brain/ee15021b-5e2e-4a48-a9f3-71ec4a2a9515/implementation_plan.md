# Owner Control Center: 1-Click Free/Paid Toggle, Private User Management & Auto-Owner Session

Deliver a private **Owner & Founder Control Center** exclusively for **Vineet Rajput**, featuring an **Instant 1-Click Free vs Paid Monetization Switch**, a **Private User Data & Access Control Panel** (view users, block/allow access, and change tiers), and **Zero-Friction Permanent Owner Auto-Login** while keeping normal authentication required for general users.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were confirmed in Phase 1:
> - **Monetization Switch**: Instant Global Switch between 100% Free Mode (zero watermarks, unlimited exports) and Paid Mode (tier quotas, watermark on free, subscription unlock).
> - **Owner Authentication**: Vineet Rajput (`alexxrajput964@gmail.com`) is permanently auto-authenticated as Owner / Super Admin with zero login friction and master access.
> - **User Management Capabilities**: Vineet Rajput has a private portal to view all registered users, block/unblock ("kisko chalana hai aur kisko nahi"), change subscription tiers, and monitor exports.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **1-Click Free vs Paid Switch**: A master toggle accessible directly from the top navigation / Owner panel. In Free Mode, everyone gets unmetered exports without watermarks. In Paid Mode, commercial tiers and watermarks are enforced automatically across the whole platform.
  2. **Owner Zero-Login Experience**: The app recognizes Vineet Rajput immediately as Founder & Super Admin. No password, no OTP dialogs—full master control out-of-the-box.
  3. **Normal User Authentication**: External users must log in/register to create and save subtitle projects. Blocked users are instantly barred from exporting or generating subtitles.
  4. **Private User Data Section**: A sleek, high-density admin dashboard showing total registered creators, contact details, daily export volumes, and 1-click actions:
     - `Allow / Active` or `Block / Suspend` ("Kisko chalana hai, kisko nahi").
     - Change Tier (`Free`, `Pro`, `Unlimited`).
     - Reset daily limits or wipe invalid data.

- **Target Audience**: Vineet Rajput (Owner & Administrator) + general content creators using Captivox.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Owner View (Vineet Rajput)**:
   - When the site loads, Vineet Rajput is pre-authenticated with the `👑 Owner (Vineet Rajput)` badge in the header.
   - Header contains a prominent **Monetization Pill**:
     - When Free: Green badge `Mode: 100% Free` with toggle button `Switch to Paid`.
     - When Paid: Amber badge `Mode: Paid & Subscriptions` with toggle button `Switch to Free`.
   - Clicking `Owner Hub` or `User Data` opens the private Admin Control Panel.

2. **Private User Data & Access Management (Owner Only)**:
   - **Metrics Strip**: Total Registered Users, Active Users, Blocked Users, Total MP4 Exports Today.
   - **User Management Table**:
     - Columns: Creator Name & Contact (Email/Phone), Registration Date, Today's Exports, Current Tier, Status (`Active` / `Blocked`).
     - Quick Action Buttons:
       - **Access Toggle**: Green `Active` button that toggles to Red `Blocked` with 1 click.
       - **Tier Selector**: 1-click dropdown or buttons (`Free` / `Pro` / `Unlimited`).
       - **Delete / Reset**: Clean actions with confirmation.

3. **External User Experience**:
   - When a new visitor arrives, they see the clean creator interface.
   - If they try to burn videos or save projects, they are prompted to log in/register via phone or email OTP.
   - If an account has been marked **Blocked** by Vineet Rajput, their session is terminated with a polite notification: *"Aapka account admin (Vineet Rajput) dwara temporarily suspended hai. Contact support for re-activation."*

### Visual Identity & Theme
- **Theme**: Dark Slate studio workspace (`#09090b` / `#111114`) with subtle hairline dividers (`border-neutral-800`).
- **Owner Accents**: Warm amber & emerald status indicators (`#ff8c1a`, `#10b981`), avoiding candy-colored clutter.
- **Data Table**: High-density table with tabular numerals (`font-mono`, `tabular-nums`) for clean vertical scanning.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Global In-Memory + Persistent Settings Store in Backend**:
  - *Approach*: Store platform settings (`monetization_mode: 'free' | 'paid'`, blocked users map) on the Express backend (`server.ts`) with disk persistence and live API endpoints (`GET /api/settings`, `POST /api/admin/toggle-monetization`, `POST /api/admin/users/:id/status`).
  - *Why*: Ensures that toggling Free vs Paid immediately takes effect across all connected clients and API validations without needing server rebuilds.

- **Decision 2: Automatic Owner Recognition with Fallback**:
  - *Approach*: Pre-load Vineet Rajput's owner account in `AuthContext` by default (`user.id = 'demo-user'`, `is_admin: true`, `role: 'owner'`). External users who sign out or clear cookies can log in with their own phone/email.
  - *Why*: Delivers the requested zero-login convenience for Vineet Rajput while enforcing strict authentication boundaries for external visitors.

- **Decision 3: Granular User Blocking Enforcement**:
  - *Approach*: Check `user.is_blocked` both on frontend routing and backend route handlers (`/api/transcribe`, `/api/exports`, `/api/projects`).
  - *Why*: Prevents blocked users from consuming Gemini API quota or server compute even if they attempt direct API calls.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CAPTIVOX FRONTEND (React 19 + Vite)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Navbar                                                                 │
│  ├── [Logo: CAPTIVOX by Vineet Rajput]                                      │
│  ├── [1-Click Free/Paid Toggle] ─── (Visible & actionable for Owner only)   │
│  └── [👑 Owner Hub / User Data] ─── (Direct link to Private Admin Console)  │
└───────────────────────┬─────────────────────────────────┬───────────────────┘
                        │                                 │
           State & Auth Context               Admin API Calls
                        │                                 │
┌───────────────────────▼─────────────────────────────────▼───────────────────┐
│                       EXPRESS BACKEND (server.ts)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  System Settings Engine:                                                    │
│  ├── GET  /api/settings                     -> { mode: 'free' | 'paid' }    │
│  ├── POST /api/admin/toggle-monetization    -> Flips global Free/Paid mode  │
│  ├── GET  /api/admin/users                  -> Returns full user directory  │
│  ├── POST /api/admin/users/:id/tier         -> Changes user tier (Free/Pro) │
│  └── POST /api/admin/users/:id/toggle-block -> Blocks/Unblocks user access  │
│                                                                             │
│  Enforcement Middleware:                                                    │
│  ├── If user.is_blocked === true: HTTP 403 Forbidden                        │
│  └── If mode === 'free': No watermark, unlimited exports for all users     │
│      If mode === 'paid': Free tier gets watermark & 3 exports/day limit     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Data Entities

1. **SystemSettings**:
   - `monetization_mode`: `'free' | 'paid'`
   - `watermark_on_free_tier`: `boolean`
   - `updated_at`: `string`

2. **UserRecord**:
   - `id`: `string`
   - `email`: `string`
   - `phone`: `string`
   - `full_name`: `string`
   - `tier`: `'free' | 'pro' | 'unlimited'`
   - `is_admin`: `boolean`
   - `is_blocked`: `boolean`
   - `exports_today`: `number`
   - `created_at`: `string`

---

## 5. Implementation Steps

1. **Backend (`server.ts`)**:
   - Add `systemSettings` state with `monetization_mode: 'free'`.
   - Add endpoints: `GET /api/settings`, `POST /api/admin/toggle-monetization`, `POST /api/admin/users/:id/toggle-block`, `POST /api/admin/users/:id/tier`.
   - Update export, transcribe, and project endpoints to reject blocked users (`403`).
   - Dynamic watermark & quota calculation based on `systemSettings.monetization_mode`.

2. **Auth Context (`src/context/AuthContext.tsx`)**:
   - Add `systemSettings` state and `toggleMonetizationMode()`.
   - Ensure Vineet Rajput is pre-authenticated with owner/admin privileges by default.
   - Handle blocked user status with clear toast and session termination.

3. **Admin Console (`src/components/AdminView.tsx`)**:
   - Redesign as the comprehensive **Owner Hub & User Data Management Center**.
   - Big Master Switch: 1-Click toggle between "100% Free Mode" and "Paid Mode".
   - High-density user table with search, status filters (Active/Blocked), 1-click Block/Unblock toggle, and Tier changer.

4. **Navbar & Editor View Integration**:
   - Add the quick-status 1-Click Free/Paid toggle directly into the Navbar for Vineet Rajput.
   - Add direct "User Data" button in Navbar for instant 1-click access to the admin panel.
   - Synchronize all watermark and upgrade modal triggers with the global `monetization_mode`.
