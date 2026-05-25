# ScaleSmart STS (Ticketing System)

ScaleSmart STS is an elegant, high-velocity operational execution queue and visual task tracker designed for peak organization in scaling operations. Built using React, Vite, Tailwind CSS, and Framer Motion, it offers absolute visual clarity, intuitive drag-and-drop workflow adjustments, and offline-first persistence natively synchronized with Google Sheets and Firebase.

Live Production URL: **[https://scalesmart-sts.vercel.app/](https://scalesmart-sts.vercel.app/)**

---

## 🛠️ Key Capabilities

- **Fluid Dual-View Navigation:** Toggle dynamically between a comprehensive, filterable **Ticket Queue List View** with multi-select bulk operations and a visual, tactile **Kanban Board** with drag-and-drop.
- **Robust Multi-Select Bulk Actions:** Query, select, and process action pools in seconds with our floating responsive bulk actions panel (shift status, update priorities, prepend tags, or wipe/delete).
- **Google Sheets Two-Way Flow:** Synchronize your boards in real-time with an active spreadsheet backed by Firebase Authentication.
- **Intelligent Offline-First Fallback:** Seamlessly capture tickets and complete logs offline. Safe local storage structures keep data completely secure and offer manual sync triggers once connection is established.
- **Custom Aesthetic Detailing:** Beautiful, eye-safe midnight slate visual canvas using refined typography pairing (Inter headings and JetBrains Mono status meters).

---

## ⚙️ Getting Started & Local Development

### Prerequisites

Ensure you have **Node.js** (v18+) and **npm** installed.

### Installation

1. **Clone the repository or extract the project bundle:**
   ```bash
   cd scalesmart-sts
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and key in your Firebase config parameters:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

4. **Launch the Local Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) inside your web browser.

5. **Build for Production:**
   To output a compiled and optimized production build to `/dist`:
   ```bash
   npm run build
   ```

---

## 🔒 Google Auth & Unauthorized Domain Troubleshooting

If you encounter a `Sign in error: FirebaseError: Firebase: Error (auth/unauthorized-domain)` error, ensure the hosting domain (e.g., `scalesmart-sts.vercel.app`) is explicitly registered inside your Firebase project:

1. Copy your active browser tab's hostname.
2. Visit the **Firebase Console** &rarr; Your Project &rarr; **Authentication** &rarr; **Settings**.
3. Under **Authorized Domains**, click **Add Domain**.
4. Paste the hostname, save your changes, then refresh and try again.

---

## 🎨 Visual System

- **Primary Type Pairing:** Inter & JetBrains Mono (specifically for queue ID tags, metrics headers, and changelog stamps)
- **Visual Contrast Elements:** Soft slate frames, responsive micro-interactions via Framer Motion, and distinct priority badges (P0 &rarr; P3).
