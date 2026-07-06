# Workspace Context & Architectural Blueprint
## Project Name: Cardinal Overture Partner Workspace & Procurement Ledger
## Platform Readiness: Google Antigravity Configuration

---

## 1. Executive Summary & Vibe
Cardinal Overture is a high-performance web console styled in an aesthetic **"Cosmic Slate"** dark visual theme (using premium Inter & JetBrains Mono typography, custom grid alignments, and smooth micro-animations). It acts as the command center for our F1 in Schools campaign, allowing Team Administrators, Sponsors, and Judges/Evaluators to interact and coordinate resources, CAD deliverables, Gantt milestones, and procurement pledges.

---

## 2. Authentication & Secure Portal Routing
The authentication layer is defined in `/src/components/AuthGate.tsx`. It implements a robust, secure dual-authentication design:

### A. Core Authentication Engines
1. **Firebase Authentication (Sign In with Google):**
   - Connected securely via Google OAuth.
   - Initialized with specific Google Workspace Gmail API scopes:
     - `https://mail.google.com/`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
   - Dynamically extracts the OAuth credential token (`accessToken`) and caches it in secure memory to execute client-authorized Gmail REST API calls.

2. **Supabase / Custom Client-Side State Engine:**
   - Fallback database and local storage persistence mapping (`cardinal_custom_session`).
   - Standard user session models fallback to Local Simulation Mode when Supabase variables are absent. This allows a robust offline sandbox workflow.

### B. Role-Based Permissions
Upon login, the user's role is extracted from their email or custom metadata:
*   **Team (Lead Administrator):** Complete control. Can create/delete procurement items, assign deliverables, manage sponsor allocations, export CSV ledgers, and trigger bulk sponsor notifications.
*   **Sponsor (Valued Partner):** High-density single-screen viewpoint. Can pledge open items, track and mark their assigned covenants/deliverables, copy draft scripts, and send automated verification emails directly to their inbox.
*   **Judge (Evaluator/Guest):** Read-only overview of iterations, Gantt milestones, and active sponsor commitments for evaluation.
*   **Access Control Principle:** Non-admins are strictly blockaded from Settings panels or modification tools.

### C. Local Simulation Profile Cheatsheet
To test the portal without requiring live credentials:
*   `sponsor@example.com` ➔ Log in as a Value Sponsor.
*   `judge@example.com` ➔ Log in as a Judge/Evaluator.
*   Any other email ➔ Log in as a Team Admin.

---

## 3. Procurement Ledger & Pledge Pipeline
The application tracks procurement requirements (materials, tooling, software licences) and allows sponsors to back specific items.

1. **Items State:** Managed dynamically. If an item is unpledged, it displays a high-contrast **"PLEDGE RESOURCE"** button.
2. **Pledging Action:** When a sponsor clicks "Pledge", the item status updates to `Pledged` and gets locked to their email and organization name.
3. **Pledge Persistence:** Actions automatically update parent state.
4. **CSV Export Ledger:** Administrators can download the entire pledge matrix as a spreadsheet (`.CSV`) formatted for bookkeeping.

---

## 4. Google Workspace & Gmail REST API Integration
To bridge operations directly to Google Workspace, we have integrated Gmail dispatch workflows:

### A. Authorization & Token Flow
When a user logs in via the Google Sign-In Portal, Firebase Auth intercepts the Google OAuth credential and caches the `accessToken`. This token is passed down via `AuthContext`.

### B. Transmission Architecture (`/src/lib/gmail.ts`)
The Gmail API requires raw, base64url-encoded RFC 2822 email messages sent to `/gmail/v1/users/me/messages/send`. The helper file securely crafts and submits these:
*   **Recipient Routing:** Auto-routes copy to the sponsor's designated email address.
*   **Subject Line:** `Pledged Resources Confirmation - Cardinal Overture F1 in Schools` or `New Strategic Deliverable Assigned`
*   **Message Contents:** A clean, professional, formal receipt detailing every item, individual costs, due dates, and campaign thank-yous.

---

## 5. Live File Tree & Key Modules
*   `/src/components/AuthGate.tsx` ➔ Google Sign-In, Firebase initializing, mock-reconciler, role routing.
*   `/src/components/PartnerPortal.tsx` ➔ Core pledge tables, administrator control panel, commitment dispatcher, and Gmail trigger buttons.
*   `/src/lib/gmail.ts` ➔ Clean REST envelope construction and Base64 URL serialization.
*   `/src/components/Header.tsx` ➔ Title, contextual role metrics, settings gates, and clickable `SIGN OUT` controls.
