# CARDINAL :: OVERTURE — Full Capabilities Reference

> A project management and operations portal built for **Cardinal F1 in Schools** racing team. This document describes every module, feature, and user-facing capability of the Overture system in precise detail.

---

## Table of Contents

1. [System Architecture and Infrastructure](#1-system-architecture-and-infrastructure)
2. [Authentication and Access Control](#2-authentication-and-access-control)
3. [Role System and Permissions Matrix](#3-role-system-and-permissions-matrix)
4. [Module: Command Center (Gantt / Task Dashboard)](#4-module-command-center-gantt--task-dashboard)
5. [Module: Team To-Dos](#5-module-team-to-dos)
6. [Module: Engineering and R&D Hub](#6-module-engineering-and-rd-hub)
7. [Module: Sponsor / Partner Portal](#7-module-sponsor--partner-portal)
8. [Module: Access Control Panel (Admin Only)](#8-module-access-control-panel-admin-only)
9. [Module: Public / Guest View (Progress and Timeline)](#9-module-public--guest-view-progress-and-timeline)
10. [Settings and System Tools (Admin Only)](#10-settings-and-system-tools-admin-only)
11. [Database Schema and Supabase Integration](#11-database-schema-and-supabase-integration)
12. [Design System and UI](#12-design-system-and-ui)

---

## 1. System Architecture and Infrastructure

### Frontend
- Built with **React + TypeScript** using **Vite** as the build tool.
- UI library: **Framer Motion** (`motion/react`) for animations and transitions.
- 3D rendering: **@react-three/fiber** + **@react-three/drei** with `three-stdlib`s `STLLoader` for rendering `.stl` files.
- Styling: **Tailwind CSS** (utility-first, monochromatic zinc/black palette).

### Backend / Data Layer: Hybrid Model
The app operates in two modes simultaneously:
- **LOCAL mode** (`○ LOCAL` indicator in header): When Supabase is not configured, all data is managed in `localStorage`. The app works entirely offline with no backend dependency.
- **CLOUD mode** (`● CLOUD` indicator in header): When Supabase credentials (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) are present in the environment, all reads and writes are automatically synced to the cloud Supabase PostgreSQL database. Realtime subscriptions keep all connected clients in sync.

### Data Sync
- All data operations (create, update, delete) are immediately persisted to Supabase via `supabaseService.ts`.
- Supabase Realtime is enabled on every table. Any change made by one user is reflected live on all other connected clients.
- Tables with Realtime replication: `nodes`, `cad_iterations`, `expenditures`, `news_updates`, `authorized_users`, `account_requests`, `sponsor_commitments`.

---

## 2. Authentication and Access Control

### Login System
- A full **auth gate** (`AuthGate.tsx`) wraps the entire app. Unauthenticated visitors see only the **Public / Guest View**.
- Supports both **Supabase Auth** (email/password via `supabase.auth`) and a **custom credential session** system stored in `localStorage` (key: `cardinal_custom_session`). The custom session system allows pre-configured credential kits to work without Supabase email confirmation flows.
- Users log in with an **email + password** pair.

### Greenlight Verification
- Every login attempt is cross-checked against the `authorized_users` table.
- Users with `is_greenlit = false` are **immediately signed out**, even if their Supabase Auth credentials are valid. Access is only granted by an Admin activating the greenlight toggle in the Access Control Panel.
- Users not found in `authorized_users` at all are also rejected.

### Sign-Up / Account Request Flow
- Public visitors can submit an **access request** (email + optional note) from the Guest view. This is written to the `account_requests` table in Supabase.
- The Admin reviews pending account requests in the Access Control Panel and provisions credentials manually.

### Sessions
- Sessions persist across browser refreshes. Closing and reopening the browser restores the session from `localStorage`.
- Sign-out immediately clears the session and returns the user to the Guest view.

---

## 3. Role System and Permissions Matrix

The app enforces strict role-based access. There are **4 auth roles** and **3 department sub-roles**.

### Auth Roles

| Role | Description |
|---|---|
| **Admin** | Full access to all modules including Access Control. Can switch department viewpoints. |
| **Team** | Access to Command Center, To-Dos, Engineering and R&D, and Sponsor Portal. Fixed to their department. |
| **Sponsor** | Access to Sponsor Portal only. Sees their own pledged items, commitments, CAD iterations, and Gantt chart. |
| **Guest** | Unauthenticated visitors. Sees only the public Progress and Timeline page. |

### Department Sub-Roles (for Team/Admin)

| Department | Permission Level |
|---|---|
| **PM** | Full write access: can create/delete nodes, manage tasks, change project dates. |
| **Design** | Read + status-update for Design tasks. Cannot delete or create nodes in NodeList. |
| **Engineering** | Read + status-update for Engineering tasks. Cannot delete or create nodes in NodeList. |

Admin users can **dynamically switch** between PM / Design / Engineering viewpoints using a dropdown in the header, allowing them to preview what any team member sees.

---

## 4. Module: Command Center (Gantt / Task Dashboard)

**Who sees it:** Admin, Team members.

This is the primary project-management dashboard split into two panes:
- Left pane: **Node Engine / Active Tasks** (task list table)
- Right pane: **Active Gantt / Timeline** (visual Gantt chart)

### Node Engine (Task List — NodeList.tsx)

A tabular view of all project tasks (`nodes`), showing:
- **ID** — auto-generated alphanumeric task identifier (e.g., `N-A1B2`)
- **Title** — name of the task
- **Dept** — owning department (PM, Design, Engineering, Everyone)
- **Status** — current status: `To Do`, `In Progress`, `Completed`
- **Dependency** — if a task depends on another, the parent node ID is shown inline as a badge.

#### Visibility Rules
- **PM/Admin** users see all tasks across all departments.
- **Design** members see tasks tagged as `Design` or `Everyone`.
- **Engineering** members see tasks tagged as `Engineering` or `Everyone`.

#### Actions
- **PM only**: A `+ NEW NODE` button opens the New Node Modal to create a task.
- **All authed team members**: Inline `<select>` to update task status directly in the table.
- **PM only**: `[DEL]` button to delete a task (with immediate Supabase sync + localStorage fallback).

### New Node Modal (NewNodeModal.tsx)

A form modal for creating project tasks with the following fields:
- **Title** (required)
- **Description** (free text)
- **Department** — PM / Design / Engineering / Everyone
- **Planned Start Date** (date picker)
- **Planned End Date** (date picker)
- **Actual Start Date** (optional — triggers Gantt progress bar rendering)
- **Actual End Date** (optional)
- **Dependency** — enter another node ID to chain tasks
- **Assigned To** — dropdown from the list of Team members in `authorized_users`

### Gantt Chart (GanttChart.tsx)

A fully SVG-based, scrollable Gantt chart rendered from the `nodes` data:

- **Timeline axis**: Date header showing `M/DD` labels for every calendar day in the project range.
- **TODAY line**: A red dashed vertical line marking the `simulatedDate` which the Admin can configure in Settings.
- **Department groupings**: Tasks are visually grouped by department with a header row per group.
- **Per-task rows** contain:
  - **Left panel**: Shows the Node ID in a fixed sidebar column.
  - **Task name + dependency label**: Rendered above the bars, anchored to the planned start.
  - **Planned bar** (thin, dark gray): Represents the planned start to end window.
  - **Actual bar** (thicker, colored by department): Only appears when `actual_start` is set. Width extends to `actual_end` or to `simulatedDate` if still In Progress. Contains duration text (e.g., `14d` or `14d (ip)` for in-progress).
- **Department colors**:
  - PM: `#f4f4f5` (zinc-100, white)
  - Design: `#d4d4d8` (zinc-300, light gray)
  - Engineering: `#71717a` (zinc-500, mid gray)
  - Everyone: `#3f3f46` (zinc-700, dark gray)
- **Click any task row** to open a detail modal showing: Title, Description, Department, Status, Planned Schedule, Actual Timeline, and Dependency.
- **Export SVG button**: Downloads the entire Gantt chart as a `.svg` file (`cardinal-gantt-export.svg`) ready for use in Canva, Figma, or presentations.

---

## 5. Module: Team To-Dos

**Who sees it:** Admin, Team members (all departments).

**Path:** "To-Dos" in the navigation bar.

A dedicated task management board for actionable team to-dos, separate from the formal project schedule but **fully reflected on the Gantt chart** (To-Dos share the same `nodes` data model and Supabase table).

### To-Do List View

Displays all to-do items in a table/card format with the following columns:
- **ID** (auto-generated)
- **Title**
- **Description** (shown as body text below the title)
- **Status** — `To Do`, `In Progress`, `Completed` (with color-coded badges)
- **Department** — PM / Design / Engineering / Everyone
- **Assigned To** — name of the team member assigned to this item
- **Planned Dates** — start and end dates
- **Dependency** — linked node ID if this to-do depends on another task

### Creating a To-Do
Any authenticated team member or Admin can open the **"+ New To-Do"** form. Fields include:
- **Title** (required)
- **Description** (multi-line free text)
- **Department** selector
- **Assign To** — dropdown populated from `authorized_users` (Team members only)
- **Planned Start** (date picker)
- **Planned End** (date picker)
- **Dependency** — optional ID of a parent task

### Inline Editing
Any existing to-do can be expanded inline for editing. An Edit button switches the row into an edit mode where **all fields are editable in place**:
- Title
- Description
- Department
- Assigned To (dropdown)
- Status
- Planned Start / End Dates
- Dependency

Changes are saved immediately to Supabase on confirm.

### Deletion
Admin or PM users can delete any to-do via a trash icon. Non-PM team members see a disabled action indicator.

### Gantt Reflection
Since To-Dos use the same `Node` type and `nodes` table as project tasks, they automatically appear in the Gantt chart on the Command Center and in the Guest view. This gives stakeholders real-time visibility into operational task scheduling.

---

## 6. Module: Engineering and R&D Hub

**Who sees it:** Admin, Team members.

**Path:** "Engineering and R&D" in the navigation bar.

A CAD iteration repository and part tracker for the F1 car and all sub-components. Supports any part, not just the car body.

### Iteration Grid
All CAD iterations are displayed as cards in a **responsive grid** (1 to 4 columns depending on screen width). Each card shows:
- **Part Name** — user-defined name for the component (e.g., "Front Nose Cone", "Rear Wing")
- **Iteration ID + Date** — system-generated ID and creation date
- **Status badge** — selectable by Admin: `Draft`, `Simulated`, `Milled`, `Rejected`
- **3D Model Viewer** — if an STL file has been uploaded, an interactive 3D viewport occupies the card center:
  - Auto-rotates at 2 rpm
  - Full orbit controls (drag to rotate, scroll to zoom, right-click to pan)
  - Metallic zinc material rendering (roughness: 0.5, metalness: 0.8)
  - Environment lighting (city preset)
  - Graceful error boundary — if the STL is corrupted, shows a fallback warning instead of crashing
  - Overlay label: "LBM / Virtual Wind Tunnel Active"
- **Upload zone** (Admin only, shown when no model exists): Click-to-upload `.stl` file area
- **CAD File Reference** — the file name/reference string
- **Description** — custom description text (truncated to 2 lines, expandable via detail modal)
- **Weight** — in grams. If below 50g, highlighted with a red warning badge
- **Weight Delta** — compared against the previous iteration in the list:
  - Down arrow + grams in bright white (improvement)
  - Up arrow + grams in dim zinc (regression)
  - "Baseline" for the first iteration
  - "No Change" if identical

### Admin Actions (hover-reveal on cards)
- **Edit** — opens the iteration in the New Iteration Modal pre-filled with existing data
- **Delete** — permanently removes the iteration from Supabase + localStorage

### Status Workflow (Admin, inline dropdown)
Admin users can move any iteration through its workflow directly on the card:
`Draft` → `Simulated` → `Milled` → `Rejected`

### New Iteration Modal (NewIterationModal.tsx)
Opens for both creating new iterations and editing existing ones. Fields:
- **Part Name** — name of the component being iterated
- **CAD File Reference** — file name or path string
- **Date** — iteration date (date picker)
- **Weight (grams)** — numeric weight
- **Status** — Draft / Simulated / Milled / Rejected
- **Version / Iteration label** — version string
- **Description** — free text (design notes, simulation summary, etc.)

### Iteration Detail Modal (IterationDetailModal.tsx)
Clicking the 3D model area on a card opens a full-screen detail modal:
- Full-size 3D model viewer
- All metadata (part name, ID, date, weight, status, description, file ref)
- Upload model button (Admin only) — replace or set the STL file
- Edit button — opens the edit modal
- Delete button — removes the iteration

### Export R&D Log
A CSV export button in the header downloads all iterations as `cardinal-rnd-log.csv`. Columns: ID, Part Name, Date, CAD File Ref, Weight (g), Status, Description.

---

## 7. Module: Sponsor / Partner Portal

**Who sees it:** Admin (full view), Team members (full view with sponsor-switching), Sponsors (their own data only).

**Path:** "Sponsor Portal" in the navigation bar.

The most feature-rich module in the system. It handles all sponsor-facing interactions, financial tracking, and strategic deliverables.

---

### 7.1 Procurement / Budget Tracker (Expenditures)

#### What it shows
A full table of all procurement items the team needs to fund, categorized by type:
- **Item Name** — what is being purchased
- **Category** — Manufacturing, Materials, Software, Travel, Marketing, Entry Fees
- **Cost** — in INR
- **Needed By** — deadline date
- **Status** — Pending, Pledged, Purchased
- **Pledged By** — sponsor name + email (if someone has pledged this item)

#### Financial Summary Cards
At the top of the section:
- **Total Budget Required** — sum of all item costs
- **Total Pledged** — sum of all Pledged items
- **Remaining / Gap** — difference
- **Progress bar** — visual percentage of campaign funding secured

#### Adding Items (Admin/PM)
A form to add new procurement line items with all fields listed above.

#### Pledging an Item (Sponsors)
Sponsors see only unpledged items. They can click **Pledge This Item** on any line item, enter their name and email, and the system:
- Marks the item as `Pledged`
- Logs the sponsors name and email against the item
- Optionally triggers an email notification (via emailService.ts)
- Syncs immediately to Supabase

#### Unpledging (Admin/PM)
Admin can remove a pledge from any item (resets it to Pending).

#### Deleting Items (Admin/PM)
Admin can remove procurement line items entirely.

---

### 7.2 CAD Iterations (in Sponsor Portal context)

Sponsors can view all CAD iterations from within the Sponsor Portal. The same 3D model tiles from Engineering and R&D are surfaced here. Admins can also upload, edit, and delete iterations directly from within the Sponsor Portal interface.

---

### 7.3 Project Timeline (Gantt Chart)

A full Gantt chart embed within the Sponsor Portal, identical to the Command Center Gantt but presented in the context of partner transparency. Sponsors see the full project execution timeline.

---

### 7.4 News Updates / Team Announcements

Admins can post **news updates** visible to sponsors:
- **Title** — headline of the update
- **Content** — body text
- **Author** — auto-set to the logged-in users name
- **Date** — auto-set at time of creation

Sponsors see the full news feed in their portal view. Admin can delete any news update.

---

### 7.5 Sponsor Commitments (Strategic Action Items)

A task-tracker for **obligations assigned to sponsors** — things the team is asking the sponsor to deliver (e.g., "Provide materials quote by X", "Attend presentation", "Send signed MOU").

#### Fields
- **Title** — name of the commitment
- **Description** — detailed explanation of what is required
- **Due Date** — deadline
- **Sponsor Email** — which sponsor this is assigned to
- **Assigned By** — the team member creating the commitment
- **Status** — In Queue, In Progress, Fulfilled

#### Admin Capabilities
- Create new commitments and assign them to any sponsor
- Update status of any commitment
- Delete commitments

#### Sponsor View
Sponsors see only commitments assigned to their own email. They can see status but cannot edit.

---

### 7.6 Admin Sponsor-Switching

Admins can **simulate any sponsors view** using a dropdown that lists all registered sponsors (derived from both `authorized_users` with Sponsor role and `expenditures` pledge history). Selecting a sponsor shows exactly what that sponsor sees when they log in.

---

## 8. Module: Access Control Panel (Admin Only)

**Who sees it:** Admin users only.

**Path:** "Access Control" in the navigation bar (only appears for Admin auth role).

This is the user management hub for provisioning and managing all accounts.

### Authorized Users List

Displays all users in `authorized_users` with:
- **Email**
- **Role** (Admin / Team / Sponsor / Judge)
- **Department** (Design / Engineering / PM — for Team/Admin roles)
- **Notes** — internal label (e.g., "Lead Admin - Raghav")
- **Password** (shown/hidden toggle per row)
- **Greenlight status** — whether the account is activated (green checkmark) or blocked (red X)

### Inline User Editing
Click the edit pencil on any user row to edit in place:
- Role selector
- Department selector
- Password field (with show/hide toggle)
- Notes field

Save or cancel the edit without leaving the panel.

### Adding New Accounts

A form at the top of the panel:
- **Email Address** — target users email
- **Role** — Admin / Team / Sponsor / Judge
- **Department** — (for Team roles)
- **Password** — randomly pre-generated 8-character secure password (can regenerate)
- **Notes** — internal label
- **Greenlight Immediately** toggle — whether to activate on creation or require manual approval

On submit, the account is written to `authorized_users` in Supabase. The user can immediately log in using the provisioned email + password.

### Credential Kit Copy
Each user row has a **"Copy Login Kit"** button that copies a formatted credential block to the clipboard, ready to be sent directly to sponsors or team members.

### Password Visibility
Each users password can be revealed/hidden individually with an eye icon toggle.

### Account Request Queue

A separate section shows **pending sponsor registration requests** submitted from the Guest view. For each request:
- Email address
- Notes/message from the requester
- Date submitted

Admins can delete requests from the queue (after provisioning credentials manually or rejecting).

---

## 9. Module: Public / Guest View (Progress and Timeline)

**Who sees it:** Anyone who is not logged in.

**Path:** "Progress and Timeline" (single nav item for guests).

This is the public-facing page for potential sponsors, parents, or any visitor who lands on the deployment URL without credentials.

### Campaign Funding Progress Panel
Displays live financial stats pulled from the `expenditures` table:
- **Target Campaign Budget** (total of all items in INR)
- **Amount Secured / Pledged** (sum of Pledged items)
- **Remaining Funding Gap**
- **Progress Bar** — animated, shows % of campaign funded

### Sponsor Registration Form ("Register Now")
Prominently centered, large call-to-action for potential sponsors:
- **Email Address** field (required)
- **Organization Note / Message** field (optional)
- **Submit button**: "REGISTER / SUBMIT ACCESS REQUEST"
- On submission, writes to `account_requests` table in Supabase
- Shows success confirmation message

### Gantt Chart (Full-size, 650px height)
The full project Gantt chart is embedded below the registration form. A large, scrollable timeline showing all project tasks, planned vs. actual bars, and the TODAY line. This gives visitors full transparency into the teams execution timeline.

### Header "PARTNER LOGIN" Button
A prominent white button in the header that opens the login modal, directing known sponsors to authenticate and access their private portal.

---

## 10. Settings and System Tools (Admin Only)

Accessed via the gear icon in the top-right header. Only visible to Admin users.

### Simulated Date Control
- Admin can set a **"Simulated Today" date** that drives the red TODAY line on the Gantt chart and all In Progress duration calculations.
- Useful for presentations, demos, or replaying project state at a past or future date.

### Data Export
- **Export JSON** button: Downloads a full snapshot of all app data (nodes, iterations, expenditures, news updates, authorized users) as a `.json` file.
- Useful for backups or migrating data between environments.

### Data Import
- **Import JSON** button: Upload a previously exported `.json` file to restore or seed data.
- Overwrites current local state with the imported snapshot.

### Supabase SQL Schema
- A collapsible **SQL Script** section shows the complete CREATE TABLE schema and RLS policies required to set up the Supabase backend from scratch.
- Includes a **Copy** button to copy the full SQL to clipboard, ready to paste into the Supabase SQL Editor.
- Tables covered: `authorized_users`, `nodes`, `cad_iterations`, `expenditures`, `news_updates`, `account_requests`, `sponsor_commitments`.
- Includes seeded admin accounts for the Cardinal team.

---

## 11. Database Schema and Supabase Integration

### Tables

| Table | Purpose |
|---|---|
| `nodes` | Project tasks and team to-dos (shared data model) |
| `cad_iterations` | Engineering part/component CAD iterations |
| `expenditures` | Procurement line items and sponsorship pledges |
| `news_updates` | Team announcements shown to sponsors |
| `authorized_users` | User whitelist with roles, passwords, greenlight status |
| `account_requests` | Public sponsor registration requests |
| `sponsor_commitments` | Action items assigned to specific sponsors |

### nodes Schema (Tasks and To-Dos)
```
id TEXT PRIMARY KEY
title TEXT NOT NULL
description TEXT
department TEXT NOT NULL      -- PM | Design | Engineering | Everyone
status TEXT NOT NULL          -- To Do | In Progress | Completed
planned_start DATE NOT NULL
planned_end DATE NOT NULL
actual_start DATE
actual_end DATE
dependency TEXT               -- references another nodes ID
assigned_to TEXT              -- email or name of assignee
```

### cad_iterations Schema
```
id TEXT PRIMARY KEY
date TEXT NOT NULL
cad_file_ref TEXT NOT NULL    -- filename or path reference
weight_grams NUMERIC NOT NULL
drag_coefficient_cd NUMERIC   -- reserved field
status TEXT NOT NULL          -- Draft | Simulated | Milled | Rejected
model_url TEXT                -- URL to hosted STL blob
model_name TEXT
description TEXT
part_name TEXT                -- e.g. "Front Wing", "Nose Cone"
```

### expenditures Schema
```
id TEXT PRIMARY KEY
item_name TEXT NOT NULL
cost NUMERIC NOT NULL
category TEXT NOT NULL        -- Manufacturing | Materials | Software | Travel | Marketing | Entry Fees
needed_by DATE NOT NULL
status TEXT DEFAULT Pending   -- Pending | Pledged | Purchased
pledged_by_email TEXT
pledged_by_name TEXT
```

### sponsor_commitments Schema
```
id TEXT PRIMARY KEY
sponsor_email TEXT NOT NULL
sponsor_name TEXT NOT NULL
title TEXT NOT NULL
description TEXT NOT NULL
due_date TEXT NOT NULL
status TEXT NOT NULL          -- In Queue | In Progress | Fulfilled
assigned_by TEXT NOT NULL
```

### Row-Level Security (RLS)
All tables have RLS enabled. Policies allow:
- **Public SELECT** on all tables (read-only for unauthenticated/guest clients)
- **Full write access** for all authenticated sessions (custom session or Supabase Auth)
- `account_requests` has a special INSERT-only public policy for guest registrations

### Realtime
All 7 tables are enrolled in Supabase Realtime (`supabase_realtime` publication), enabling live multi-client synchronisation without page refresh.

---

## 12. Design System and UI

### Aesthetic: Retro / Industrial Command Interface
The entire app uses a deliberate **monochromatic zinc-on-black** palette inspired by military terminals and industrial control systems.

- **Background**: Pure black with `zinc-950` and `zinc-900` for surface layers
- **Text**: `zinc-100` to `zinc-600` hierarchy for content, labels, and secondary metadata
- **Accent**: `emerald-400` / `emerald-500` for success states, greenlit badges, and funding progress
- **Warning**: `amber-400` for "In Progress" status
- **Danger**: `rose-400` / `red-500` for overweight alerts, deletion actions, and the TODAY line on the Gantt
- **Typography**: Monospaced fonts for all labels, IDs, metadata, and navigation. All labels are UPPERCASE with wide letter-spacing.

### Animations
- Page transitions and modal entries use **Framer Motion** for smooth fade and slide effects.
- Hover states on cards, buttons, and table rows provide micro-animation feedback.
- 3D models auto-rotate with OrbitControls.

### Connection Status Indicator
The header always shows `● CLOUD` (emerald) or `○ LOCAL` (zinc) to indicate whether Supabase is connected, making it immediately clear what data backend is active.

### User Identity Badge
When logged in, the header shows a small monospaced badge confirming the current role and display name at all times.

---

*Document generated from source: Cardinal F1 in Schools, Overture Management Portal.*
