# TalentMine — Deployment & Firebase Google Auth Guide

This guide walks you through:
1. **Setting up Google Authentication via Firebase**
2. **Pushing your project to GitHub**
3. **Deploying the application to Vercel**
4. **Running the PHP backend locally or in production**

---

## 1. Setting Up Google Auth via Firebase

TalentMine is pre-configured with a seamless Firebase Auth integration layer in [`frontend/js/auth.js`](file:///c:/Users/ibrah/code/etc/TalentMine/frontend/js/auth.js) and [`frontend/js/config.js`](file:///c:/Users/ibrah/code/etc/TalentMine/frontend/js/config.js).

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Sign in with your Google Account.
3. Click **Add project** (or **Create a project**).
4. Enter a project name (e.g., `talentmine-app`).
5. (Optional) Disable or enable Google Analytics, then click **Create project**.

### Step 2: Enable Google Sign-In Provider
1. In the left navigation menu of Firebase Console, click on **Build** &rarr; **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, select **Google** from the list of providers.
4. Toggle **Enable**.
5. Choose a **Project public-facing name** and select your **Project support email**.
6. Click **Save**.

### Step 3: Register Your Web App & Obtain Config Keys
1. In the Firebase Project Overview (gear icon &rarr; **Project settings**), scroll down to **Your apps**.
2. Click the **Web** icon (`</>`) to add a web app.
3. Enter an app nickname (e.g., `talentmine-web`) and click **Register app**.
4. You will see a `firebaseConfig` object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "talentmine-app.firebaseapp.com",
     projectId: "talentmine-app",
     storageBucket: "talentmine-app.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:..."
   };
   ```

### Step 4: Add Authorized Domains
1. In Firebase Console &rarr; **Authentication** &rarr; **Settings** &rarr; **Authorized domains**.
2. Add your deployment domains:
   - `localhost` (already present by default for local testing)
   - `127.0.0.1`
   - Your future Vercel domain: `your-project-name.vercel.app`

### Step 5: Connect Firebase in TalentMine
1. Open [`frontend/js/config.js`](file:///c:/Users/ibrah/code/etc/TalentMine/frontend/js/config.js) and paste your credentials into `CONFIG.FIREBASE_CONFIG`:
   ```javascript
   FIREBASE_CONFIG: {
     apiKey: "AIzaSy...",
     authDomain: "talentmine-app.firebaseapp.com",
     projectId: "talentmine-app",
     storageBucket: "talentmine-app.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   }
   ```
2. In [`frontend/index.html`](file:///c:/Users/ibrah/code/etc/TalentMine/frontend/index.html), add the official Firebase SDK CDN scripts right above your script tags:
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
   <script>
     // Initialize Firebase
     firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
   </script>
   ```
3. Whenever a user clicks **"Continue with Google"**, `AuthModule.triggerGoogleAuth()` automatically triggers the standard Google sign-in popup, creates the user session, and takes them into the TalentMine workspace!

*(Note: Even without pasting keys yet, TalentMine already includes a built-in interactive simulator so you and your team can test the Google Auth flow immediately!)*

---

## 2. Pushing the Project to GitHub

### Step 1: Initialize Git
Open your terminal or PowerShell in `c:\Users\ibrah\code\etc\TalentMine`:
```powershell
git init
```

### Step 2: Add Files & Commit
```powershell
git add .
git commit -m "feat: modular frontend, php backend, realistic talent data and vercel config"
```

### Step 3: Create a GitHub Repository
1. Go to [github.com](https://github.com) &rarr; Click **New repository**.
2. Name the repository: `TalentMine` (or any name you prefer).
3. Keep it Public or Private, and leave "Initialize with README" unchecked.
4. Click **Create repository**.

### Step 4: Push Local Repository to GitHub
Copy the remote commands shown on GitHub:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/TalentMine.git
git branch -M main
git push -u origin main
```

---

## 3. Deploying to Vercel via GitHub

### Step 1: Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. In the Vercel Dashboard, click **Add New...** &rarr; **Project**.
3. Find your `TalentMine` repository from the list and click **Import**.

### Step 2: Configure Project Settings
- **Project Name**: `talentmine`
- **Framework Preset**: `Other` (Static HTML/JS)
- **Root Directory**: `./` (Default)
- The repository already includes a pre-configured [`vercel.json`](file:///c:/Users/ibrah/code/etc/TalentMine/vercel.json) that automatically routes the root URL `/` directly to `/frontend/index.html`.

### Step 3: Deploy
1. Click **Deploy**.
2. Within 15–30 seconds, Vercel will finish building and provide a live URL, such as:
   `https://talentmine-yourname.vercel.app`
3. Click on the URL to open your live platform!

---

## 4. How the Backend & Data Mining Works

### Local PHP Execution
To run the PHP backend and frontend locally:
```powershell
php -S 127.0.0.1:8000
```
Open `http://127.0.0.1:8000` in your browser. TalentMine will automatically connect to the live PHP endpoints (`/backend/api/candidates.php`, `/backend/api/stats.php`, `/backend/api/export.php`).

### Cloud Static Deployment (Vercel)
Vercel's default global CDN hosts static websites (HTML, CSS, JS). 
- Because TalentMine features a **resilient hybrid architecture**, [`frontend/js/api.js`](file:///c:/Users/ibrah/code/etc/TalentMine/frontend/js/api.js) automatically detects if a PHP server is present.
- If deployed statically on Vercel without a PHP runtime, the platform **gracefully switches to the client-side data adapter** with zero errors. All filters, search queries, deduplication simulation, and CSV/JSON exports work 100% out of the box!
- If you'd like to run the PHP backend on a cloud host, you can deploy the `backend/` folder to platforms like **Railway**, **Render**, or a traditional Apache/Nginx VPS, and update `CONFIG.API_BASE` in [`frontend/js/config.js`](file:///c:/Users/ibrah/code/etc/TalentMine/frontend/js/config.js) to point to your live PHP API domain.
