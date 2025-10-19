# DESIGN.md

## FarmTech — System Design (React + Tailwind + Firebase)

**Mission:**
Empower farmers with digital tools and real-time insights to make farming more productive, sustainable, and profitable.

---

## Overview

FarmTech is a web application for farmers to:

* Get information on government schemes.
* Upload photos of crops for expert advice.
* View information about pesticides, manure, and fertilizers.
* Contact specialists related to specific crops.
* Manage farm-related documents and access all information in one place.

---

## System Architecture

### 1. Frontend (React + Tailwind)

* Built as a **Single Page Application (SPA)** using React.
* Styled with **Tailwind CSS** for responsive, mobile-first UI.
* Uses **React Router** for navigation and **React Query / Context API** for state management.
* Handles all logic for interacting with Firebase (CRUD operations, auth, storage, etc.).
* Deployed via **Firebase Hosting**.

### 2. Backend (Firebase as BaaS)

* **Firebase Authentication** — Handles user login and roles (admin / farmer).
* **Cloud Firestore** — Main database for users, uploads, schemes, and contacts.
* **Firebase Storage** — Stores uploaded crop images and user documents.
* **Firebase Hosting** — Serves the React web app.

### 3. No Cloud Functions

* No backend logic outside Firebase.
* All business logic runs on the client.
* Validation and filtering handled via Firestore rules and client checks.

---

## User Roles

| Role       | Description                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| **Farmer** | Uploads crop images, applies for schemes, views recommendations, contacts specialists. |
| **Admin**  | Manages farmers, schemes, and content (like pesticides info, advisories).              |

---

## Core Features

### 👨‍🌾 Farmer Features

* Register/login (email or phone via Firebase Auth).
* Upload photos of crops (stored in Firebase Storage).
* View list of available government schemes.
* See required documents and links for applying.
* Access recommendations for pesticides, manure, fertilizers, etc.
* Contact specialists (via provided info).
* View personal uploads and status.

### 🧑‍💼 Admin Features

* Admin login with Firebase Auth.
* Dashboard showing:

  * Total number of users.
  * Uploaded crop images.
  * Scheme management.
  * User activity summary.
* Create, edit, or delete government schemes.
* Add or edit specialists and pesticide/manure information.

---

## Tech Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Frontend       | React, Tailwind CSS, React Router         |
| State Mgmt     | Context API or React Query                |
| Authentication | Firebase Authentication                   |
| Database       | Firebase Firestore                        |
| Storage        | Firebase Storage                          |
| Hosting        | Firebase Hosting                          |
| Tools          | Vite / Create React App, ESLint, Prettier |

---

## Firestore Data Model

```
/users/{userId}
  - name
  - email
  - role: 'farmer' | 'admin'
  - phone
  - farmDetails: { location, cropType, size }
  - createdAt, lastLogin

/uploads/{uploadId}
  - userId
  - imageUrl
  - description
  - cropType
  - status: 'pending' | 'reviewed'
  - adminFeedback (optional)
  - createdAt

/schemes/{schemeId}
  - title
  - description
  - eligibility
  - documentsRequired: [ { name, description } ]
  - governmentLink
  - createdAt
  - createdBy (adminId)

/contacts/{contactId}
  - name
  - specialization
  - cropType
  - contactInfo (phone/email)
  - region

/pesticides/{itemId}
  - name
  - cropType
  - description
  - recommendedUsage
  - priceRange

/stats/{statId}
  - totalUsers
  - totalUploads
  - totalSchemes
  - lastUpdated
```

---

## Firebase Security Rules (High-Level)

**Firestore Rules**

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Uploads
    match /uploads/{uploadId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin();
    }

    // Schemes (read for all, write for admins)
    match /schemes/{schemeId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Contacts and Pesticides
    match /contacts/{contactId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /pesticides/{itemId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

**Storage Rules**

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }

    function isAdmin() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## React File Structure

```
/src
  /components
    - Auth/
    - FarmerDashboard/
    - AdminDashboard/
    - Upload/
    - Schemes/
    - Contacts/
  /context
    - AuthContext.tsx
  /firebase
    - firebaseConfig.ts
  /pages
    - Login.tsx
    - Register.tsx
    - FarmerDashboard.tsx
    - AdminDashboard.tsx
    - SchemesPage.tsx
  /utils
    - formatDate.ts
    - imageHelpers.ts
  index.tsx
  App.tsx
```

---

## Firebase Initialization Example

```ts
// src/firebase/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "farmtech.firebaseapp.com",
  projectId: "farmtech",
  storageBucket: "farmtech.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "XXXXXX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

---

## Key User Flows

### 1. Farmer Registration & Login

* Sign up with email/password or phone OTP.
* Select role: **farmer** (default).
* Store profile details in `/users/{userId}`.

### 2. Upload Crop Image

* Farmer uploads an image → stored in Firebase Storage.
* Metadata (description, crop type, timestamp) saved in `/uploads`.
* Admins can view uploads from all users.

### 3. Admin Management

* Admin can:

  * View all uploads.
  * Edit schemes and pesticide/manure information.
  * Manage specialists and contacts.
  * View simple stats (from `/stats` collection).

### 4. Scheme Details

* Farmers view all government schemes.
* See eligibility, required documents, and government links.
* Admins add or update schemes directly via UI.

---

## UI/UX Guidelines

* **Simple, mobile-first design** (most farmers will use on mobile).
* Dashboard with 4 tabs:

  * 🏠 Home
  * 📤 Upload
  * 🧾 Schemes
  * 👤 Profile
* Admin menu with summary cards for:

  * Users
  * Uploads
  * Schemes

---

## Deployment

1. Build React app:

   ```bash
   npm run build
   ```
2. Deploy to Firebase Hosting:

   ```bash
   firebase deploy --only hosting
   ```
3. Update Firebase Rules in console or via:

   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

---

## Scalability & Cost Notes

* **Firestore** handles scaling automatically.
* **Storage** optimized by resizing images on client-side.
* **Auth** supports thousands of users easily.
* **No server costs** since no Cloud Functions.

---

## Roadmap

| Stage    | Features                                                    |
| -------- | ----------------------------------------------------------- |
| **MVP**  | Auth, upload, view schemes, admin dashboard                 |
| **v1.0** | Pesticide/manure info, contact specialists, stats dashboard |
| **v2.0** | Regional language support, offline caching, notifications   |

---

## Testing

* Use Firebase Emulator Suite for local Firestore + Auth + Storage testing.
* Test key user flows:

  * Farmer registration
  * Image upload
  * Scheme CRUD by admin
  * Security rules (auth restrictions)

---

