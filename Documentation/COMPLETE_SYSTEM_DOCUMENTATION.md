# FarmTech Complete System Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Environment Configuration](#environment-configuration)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [Admin System](#admin-system)
7. [Farmer System](#farmer-system)
8. [API Integration](#api-integration)
9. [File Structure](#file-structure)
10. [Deployment Guide](#deployment-guide)
11. [Troubleshooting](#troubleshooting)

---

## 1. Project Overview

### 🌾 FarmTech - Agricultural Management Platform
**Version**: 1.0.0  
**Technology Stack**: React + Vite + Supabase + Cloudinary  
**Purpose**: Complete agricultural management system with separate farmer and admin interfaces

### Key Features
- **Farmer Portal**: Crop management, order placement, upload submissions
- **Admin Portal**: Order management, upload reviews, user management
- **Real-time Sync**: Database synchronization between farmer actions and admin oversight
- **Multi-language Support**: English, Hindi, Marathi
- **Mobile Responsive**: PWA capabilities with Capacitor integration

---

## 2. System Architecture

### Frontend Architecture
```
React Application (Vite)
├── Authentication Layer (FastAuthContext)
├── Routing System (React Router)
├── State Management (Context API)
├── UI Components (Custom + Lucide Icons)
└── Mobile Wrapper (Capacitor Integration)
```

### Backend Services
```
Supabase Backend
├── Authentication (Supabase Auth)
├── Database (PostgreSQL)
├── Storage (Supabase Storage)
└── Real-time Subscriptions
```

### External Services
```
Third-party Integrations
├── Cloudinary (Image Storage)
├── Capacitor (Mobile Features)
└── PWA (Service Workers)
```

---

## 3. Environment Configuration

### 📁 `.env` File Configuration
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jemswvemfjxykvwddozx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbXN3dmVtZmp4eWt2d2Rkb3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NjkyNzgsImV4cCI6MjA3NzE0NTI3OH0.s3h9vvpGQPmtO8tMECPZVnVVqBGrtrc51Z4Lkq0sULM
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplbXN3dmVtZmp4eWt2d2Rkb3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU2OTI3OCwiZXhwIjoyMDc3MTQ1Mjc4fQ.lBekGIUqtucFRy3UFaZadUZ7rmFXaDSdZerDW4WdeuA

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=farmtech
VITE_CLOUDINARY_API_KEY=637476717652382
VITE_CLOUDINARY_API_SECRET=FlP5OBXwuaZaXFxG8hnnKYEE0n0
VITE_CLOUDINARY_UPLOAD_PRESET=farmtech_uploads

# Application Configuration
VITE_APP_NAME=FarmTech
VITE_APP_VERSION=1.0.0
VITE_ADMIN_SECRET_CODE=admin123

# Admin Credentials
VITE_ADMIN_EMAIL=admin@farmtech.com
VITE_ADMIN_PASSWORD=FarmTech@2024
```

### Environment Variables Explanation
| Variable | Purpose | Security Level |
|----------|---------|----------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Public |
| `VITE_SUPABASE_ANON_KEY` | Public API key for client operations | Public |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Admin operations key | **SENSITIVE** |
| `VITE_CLOUDINARY_*` | Image upload and storage | **SENSITIVE** |
| `VITE_ADMIN_*` | Admin authentication credentials | **CRITICAL** |

---

## 4. Database Schema

### Supabase Tables Structure

#### 4.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  role VARCHAR DEFAULT 'farmer',
  farm_location VARCHAR,
  crop_type VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.2 Orders Table
```sql
CREATE TABLE orders (
  id VARCHAR PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  farmer_name VARCHAR NOT NULL,
  farmer_email VARCHAR NOT NULL,
  farmer_phone VARCHAR,
  crop_type VARCHAR,
  farm_location VARCHAR,
  order_type VARCHAR DEFAULT 'online',
  order_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  transaction_id VARCHAR,
  payment_method VARCHAR,
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.3 Uploads Table
```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  file_name VARCHAR,
  file_path VARCHAR,
  file_size BIGINT,
  crop_type VARCHAR,
  notes TEXT,
  public_url TEXT,
  status VARCHAR DEFAULT 'pending',
  cloudinary_public_id VARCHAR,
  cloudinary_format VARCHAR,
  cloudinary_width INTEGER,
  cloudinary_height INTEGER,
  storage_type VARCHAR DEFAULT 'cloudinary',
  user_name VARCHAR,
  user_email VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.4 User Uploads Table
```sql
CREATE TABLE user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  description TEXT,
  crop_type VARCHAR,
  image_url TEXT,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(status);
```

---

## 5. Authentication System

### 5.1 Farmer Authentication
**Method**: Supabase Auth with email/password  
**Context**: `FastAuthContext`  
**Storage**: Supabase session management

```javascript
// Authentication flow
const { login, register, logout, currentUser, userProfile } = useAuth();

// Login process
await login(email, password);
// Redirects to: /dashboard (farmer interface)
```

### 5.2 Admin Authentication
**Method**: Environment-based credentials  
**Storage**: SessionStorage with 24-hour expiry  
**Security**: Separate from farmer auth system

```javascript
// Admin authentication
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

// Session management
sessionStorage.setItem('isAdmin', 'true');
sessionStorage.setItem('adminLoginTime', new Date().toISOString());
```

### 5.3 Route Protection
```javascript
// Protected routes implementation
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, userProfile } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (adminOnly && userProfile?.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
};
```

---

## 6. Admin System

### 6.1 Admin Access Points
| URL | Purpose | Authentication |
|-----|---------|----------------|
| `/admin-portal` | Modern admin login | Environment credentials |
| `/admin-login` | Legacy admin login | Environment credentials |
| `/red-admin` | Direct admin access | Session-based |
| `/red-admin-dashboard` | Main admin dashboard | Session-based |

### 6.2 Admin Credentials
```
Email: admin@farmtech.com
Password: FarmTech@2024
```

### 6.3 Admin Dashboard Features

#### Upload Management (`/admin/uploads`)
- View all farmer uploads
- Approve/reject submissions
- Image preview and crop details
- Status management (pending/approved/rejected)

#### Order Management (`/admin/orders`)
- Complete order tracking
- Transaction ID visibility
- Payment status monitoring
- Order fulfillment management

#### User Management (`/admin/users`)
- Farmer account overview
- User statistics and analytics
- Account management tools

#### Scheme Management (`/admin/schemes`)
- Government scheme administration
- Scheme application tracking
- Benefit distribution management

### 6.4 Admin UI Theme
```css
/* Admin theme colors */
:root {
  --admin-primary: #dc2626;    /* Red primary */
  --admin-secondary: #b91c1c;  /* Dark red */
  --admin-accent: #fecaca;     /* Light red */
  --admin-bg: #fef2f2;        /* Red background */
}
```

---

## 7. Farmer System

### 7.1 Farmer Access Points
| URL | Purpose | Features |
|-----|---------|----------|
| `/dashboard` | Main farmer dashboard | Overview, quick actions |
| `/farmer` | Alternative farmer route | Same as dashboard |
| `/materials` | Crop management | Upload images, submit forms |
| `/cart` | Shopping cart | Order materials and supplies |

### 7.2 Farmer Dashboard Features

#### Crop Management
- Image upload for crop issues
- Crop form submissions
- Expert consultation requests
- Treatment recommendations

#### Order System
- Browse agricultural materials
- Add items to cart
- Secure checkout process
- Payment verification

#### Upload System
- Multiple image upload (max 5)
- Crop type selection
- Detailed descriptions
- Status tracking

### 7.3 Farmer UI Theme
```css
/* Farmer theme colors */
:root {
  --farmer-primary: #10b981;   /* Green primary */
  --farmer-secondary: #059669; /* Dark green */
  --farmer-accent: #a7f3d0;    /* Light green */
  --farmer-bg: #f0fdf4;       /* Green background */
}
```

---

## 8. API Integration

### 8.1 Supabase Integration
```javascript
// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 8.2 Cloudinary Integration
```javascript
// Cloudinary service
class CloudinaryService {
  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  }

  async uploadImage(file, userId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', `farmtech/${userId}`);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );
    
    return response.json();
  }
}
```

### 8.3 Data Synchronization
```javascript
// Dual storage system for reliability
const saveUpload = async (uploadData) => {
  try {
    // Primary: Save to Supabase
    const { error } = await supabase
      .from('uploads')
      .insert(uploadData);
    
    if (error) throw error;
  } catch (error) {
    // Fallback: Save to localStorage
    const localUploads = JSON.parse(localStorage.getItem('farmtech_uploads') || '[]');
    localUploads.push(uploadData);
    localStorage.setItem('farmtech_uploads', JSON.stringify(localUploads));
  }
};
```

---

## 9. File Structure

### 9.1 Project Directory Structure
```
FarmTech/
├── public/
│   ├── images/
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── admin/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── mobile/
│   │   ├── payment/
│   │   ├── ui/
│   │   └── upload/
│   ├── contexts/
│   │   ├── FastAuthContext.jsx
│   │   ├── CartContext.jsx
│   │   ├── LanguageContext.jsx
│   │   └── NetworkContext.jsx
│   ├── hooks/
│   ├── models/
│   ├── pages/
│   │   ├── admin/
│   │   └── [farmer pages]
│   ├── services/
│   ├── stubs/
│   ├── supabase/
│   ├── utils/
│   └── App.jsx
├── Documentation/
├── .env
├── package.json
└── vite.config.js
```

### 9.2 Key Components

#### Admin Components
- `AdminPortal.jsx` - Modern admin login interface
- `RedAdminDashboard.jsx` - Main admin dashboard
- `AdminOrderManager.jsx` - Order management interface
- `AdminUploadManager.jsx` - Upload review system
- `AdminUserManager.jsx` - User management tools

#### Farmer Components
- `FarmerDashboard.jsx` - Main farmer interface
- `UploadModal.jsx` - Image upload component
- `CropFormSubmission.jsx` - Crop information form
- `Materials.jsx` - Material browsing and ordering

#### Shared Components
- `FastAuthContext.jsx` - Authentication management
- `CartContext.jsx` - Shopping cart functionality
- `LanguageContext.jsx` - Multi-language support

---

## 10. Deployment Guide

### 10.1 Development Setup
```bash
# Clone repository
git clone [repository-url]
cd FarmTech

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### 10.2 Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to hosting service
npm run deploy
```

### 10.3 Environment Setup Checklist
- [ ] Supabase project created and configured
- [ ] Database tables created with proper schema
- [ ] Cloudinary account setup with upload preset
- [ ] Environment variables configured
- [ ] Admin credentials set
- [ ] SSL certificate configured (production)

### 10.4 Database Migration
```sql
-- Run these SQL commands in Supabase SQL editor
-- 1. Create tables (see Database Schema section)
-- 2. Set up Row Level Security (RLS)
-- 3. Create indexes for performance
-- 4. Insert initial admin user if needed
```

---

## 11. Troubleshooting

### 11.1 Common Issues

#### Authentication Issues
**Problem**: Admin login fails  
**Solution**: 
1. Check environment variables in `.env`
2. Verify admin credentials match exactly
3. Clear browser cache and sessionStorage

#### Database Connection Issues
**Problem**: Data not loading  
**Solution**:
1. Verify Supabase URL and keys
2. Check network connectivity
3. Review browser console for errors
4. Test with sample data

#### Upload Issues
**Problem**: Images not uploading  
**Solution**:
1. Check Cloudinary configuration
2. Verify file size limits (10MB max)
3. Test with base64 fallback
4. Check browser permissions

### 11.2 Debug Tools

#### Browser Console Commands
```javascript
// Check admin authentication
console.log('Admin authenticated:', sessionStorage.getItem('isAdmin'));

// View local storage data
console.log('Local uploads:', JSON.parse(localStorage.getItem('farmtech_uploads') || '[]'));
console.log('Local orders:', JSON.parse(localStorage.getItem('farmtech_orders') || '[]'));

// Test Supabase connection
import { supabase } from './src/supabase/client';
const { data, error } = await supabase.from('users').select('count');
console.log('Database connection:', error ? 'Failed' : 'Success');
```

#### Network Debugging
```javascript
// Check API endpoints
fetch('https://jemswvemfjxykvwddozx.supabase.co/rest/v1/')
  .then(response => console.log('Supabase API:', response.status))
  .catch(error => console.error('API Error:', error));
```

### 11.3 Performance Optimization

#### Code Splitting
```javascript
// Lazy loading implementation
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const FarmerDashboard = React.lazy(() => import('./pages/FarmerDashboard'));
```

#### Image Optimization
```javascript
// Image compression before upload
const compressImage = (file) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Compression logic...
};
```

---

## 📞 Support and Maintenance

### Contact Information
- **Developer**: FarmTech Development Team
- **Email**: support@farmtech.com
- **Documentation**: `/Documentation/`

### Version History
- **v1.0.0**: Initial release with complete admin/farmer separation
- **v1.0.1**: Upload synchronization fixes
- **v1.0.2**: Transaction ID display improvements

### License
This project is proprietary software. All rights reserved.

---

*Last Updated: December 2024*  
*Documentation Version: 1.0.0*