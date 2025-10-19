<<<<<<< HEAD
# FarmTech
=======
# FarmTech - Agricultural Management Platform

A modern web application built with React and Firebase to empower farmers with digital tools and real-time insights.

## 🌟 Features

### For Farmers
- **Crop Photo Upload**: Upload crop images for expert analysis and advice
- **Government Schemes**: Browse and apply for agricultural schemes and subsidies
- **Expert Network**: Connect with verified agricultural specialists
- **Treatment Guide**: Access information about pesticides, fertilizers, and treatments
- **Dashboard**: Track upload history and application status

### For Admins
- **User Management**: View and manage farmer accounts
- **Upload Review**: Review and provide feedback on farmer uploads
- **Content Management**: Manage schemes, contacts, and treatment information
- **Analytics**: View system statistics and user activity

## 🚀 Tech Stack

- **Frontend**: React 18, JavaScript (JSX)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project with the following services enabled:
  - Authentication
  - Firestore Database
  - Storage

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd farmtech
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase configuration
   - Update the `.env` file with your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Firebase Setup

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && 
        request.auth.uid == userId;
    }

    match /uploads/{uploadId} {
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin();
    }

    match /schemes/{schemeId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /contacts/{contactId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /treatments/{treatmentId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{userId}/{allPaths=**} {
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.size < 10 * 1024 * 1024;
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }

    function isAdmin() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 👥 User Accounts

### Demo Accounts
The application supports two types of users:

1. **Farmer Account**
   - Register with role: "farmer"
   - Access: Upload crops, view schemes, contact specialists

2. **Admin Account**
   - Register with role: "admin"
   - Admin code: `admin123` (configured in .env)
   - Access: All farmer features + admin dashboard

### Creating Admin Account
1. Go to registration page
2. Select "Admin" account type
3. Enter admin code: `admin123`
4. Complete registration

## 📊 Database Structure

### Collections
- **users**: User profiles and farm details
- **uploads**: Crop image uploads and reviews
- **schemes**: Government schemes and subsidies
- **contacts**: Agricultural specialist information
- **treatments**: Pesticides, fertilizers, and treatments

### Sample Data
The application includes a database seeding feature:
1. Login as admin
2. Go to Admin Dashboard → Content tab
3. Click "Seed Database" to populate with sample data

## 🎨 UI Components

The application uses a custom component library built with Tailwind CSS:
- **Button**: Multiple variants (primary, secondary, outline, ghost)
- **Input**: Form inputs with validation and error states
- **Card**: Content containers with consistent styling
- **Modal**: Overlay dialogs for forms and details

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interactions
- Progressive Web App ready

## 🔒 Security Features

- Firebase Authentication
- Role-based access control
- Secure file uploads (10MB limit)
- Input validation and sanitization
- Protected routes

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy
firebase deploy
```

## 📈 Performance Optimizations

- Image compression for uploads
- Lazy loading for large lists
- Efficient Firestore queries
- Optimized bundle size with Vite

## 🧪 Testing

Run the linter:
```bash
npm run lint
```

Preview production build:
```bash
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for farmers and agricultural communities**
>>>>>>> 174a916 (first commit)
