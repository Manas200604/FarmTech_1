# 🌾 FarmTech - Agricultural Management System

[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/farmtech/farmtech)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

A comprehensive agricultural management platform that connects farmers with agricultural experts and administrators through a modern web application with separate farmer and admin interfaces.

## 📱 **Features**

### **For Farmers:**
- 🏠 **Dashboard**: Personal farming statistics and overview
- 📦 **Materials Ordering**: Browse and order agricultural materials
- 💳 **Payment System**: QR code payment verification with receipt upload
- 📋 **Crop Forms**: Submit crop information and requirements
- 📤 **File Uploads**: Upload crop images and documents
- 🛒 **Shopping Cart**: Add materials to cart and checkout
- 🌐 **Multi-language**: English, Hindi, and Marathi support

### **For Admins:**
- 👥 **User Management**: View and manage farmer accounts
- 📊 **Analytics Dashboard**: Sales, orders, and inventory analytics
- 📦 **Materials Management**: Add, edit, and manage agricultural materials
- 💰 **Payment Review**: Approve/reject farmer payment submissions
- 📋 **Crop Forms Review**: Review and respond to farmer crop forms
- 🗂️ **Upload Management**: View and delete user uploads with advanced filtering
- 📈 **Inventory Tracking**: Monitor stock levels and low inventory alerts

### **Technical Features:**
- 📱 **Cross-Platform**: Web browser and Android mobile app
- 🔄 **Offline Support**: Works without internet connection
- 🎨 **Responsive Design**: Optimized for all screen sizes
- 🔐 **Authentication**: Secure login system with role-based access
- 💾 **Data Storage**: localStorage with Supabase integration
- 🌍 **PWA Ready**: Progressive Web App capabilities

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Android Studio (for mobile app)
- Git

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FarmTech
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Add your images:**
   ```bash
   # Place your images in public/images/
   public/images/logo.png      # Your app logo
   public/images/Scanner.png   # QR code scanner image
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## 🌐 **Web Development**

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Check code quality
```

### **Login System**
- Create admin and farmer accounts through the registration system
- Role-based access control with different permissions
- Secure authentication with persistent sessions

### **Project Structure**
```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── cart/           # Shopping cart components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components (Navbar, etc.)
│   ├── mobile/         # Mobile-specific components
│   ├── payment/        # Payment system components
│   └── ui/             # Basic UI components
├── contexts/           # React contexts (Auth, Language, Cart)
├── hooks/              # Custom React hooks
├── pages/              # Main application pages
├── styles/             # CSS and styling files
├── utils/              # Utility functions and storage
└── models/             # Data models
```

---

## 📱 **Android App Development**

### **Build Android App**

1. **Build web assets:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Open Android Studio:**
   ```bash
   npx cap open android
   ```

4. **Build APK in Android Studio:**
   - Wait for Gradle sync to complete
   - Go to `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - APK will be generated in `android/app/build/outputs/apk/`

### **Android Configuration**
- **Package Name**: `com.farmtech.app`
- **Min SDK**: 24 (Android 7.0)
- **Target SDK**: 33 (Android 13)
- **Permissions**: Internet, Network State, File Storage, Camera

### **Install APK**
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎨 **Customization**

### **Logo and Branding**
1. Replace `public/images/logo.png` with your logo
2. Update app name in `capacitor.config.json`
3. Replace Android icons in `android/app/src/main/res/mipmap-*/`

### **Colors and Styling**
- Edit `tailwind.config.js` for color scheme
- Modify `src/styles/` for custom CSS
- Update theme in `capacitor.config.json`

### **Languages**
- Add translations in `src/contexts/LanguageContext.jsx`
- Supported: English (en), Hindi (hi), Marathi (mr)

---

## 🔧 **Configuration**

### **Environment Variables**
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_APP_NAME=FarmTech
```

### **Capacitor Configuration**
Edit `capacitor.config.json`:
```json
{
  "appId": "com.farmtech.app",
  "appName": "FarmTech",
  "webDir": "dist"
}
```

---

## 📊 **Features Overview**

### **Materials Management**
- Browse agricultural materials catalog
- Add items to shopping cart
- Place orders with delivery details
- Track order status and history

### **Payment System**
- QR code scanner for payments
- Upload payment screenshots
- Admin verification system
- Payment history tracking

### **Upload System**
- Upload crop images and documents
- Categorize uploads (crop, payment, document, general)
- Admin review and approval system
- Advanced search and filtering

### **Multi-language Support**
- English, Hindi, and Marathi
- Dynamic language switching
- Localized content and UI

### **Admin Dashboard**
- User management and analytics
- Sales and inventory reports
- Payment verification workflow
- Content management system

---

## 🛠️ **Development**

### **Tech Stack**
- **Frontend**: React 18, Vite, Tailwind CSS
- **Mobile**: Capacitor, Android Studio
- **State Management**: React Context API
- **Storage**: localStorage, Supabase (optional)
- **Authentication**: Custom auth system
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library

### **Code Quality**
- ESLint for code linting
- Prettier for code formatting
- TypeScript support (optional)
- Component-based architecture

### **Performance**
- Lazy loading for components
- Image optimization
- Offline caching
- Virtual scrolling for large lists

---

## 🚀 **Deployment**

### **Web Deployment**
1. Build the project: `npm run build`
2. Deploy `dist/` folder to your web server
3. Configure server for SPA routing

### **Android Deployment**
1. Build APK in Android Studio
2. Sign APK for release
3. Upload to Google Play Store or distribute directly

### **Updates**
1. Make code changes
2. Run `npm run build`
3. Run `npx cap sync android`
4. Rebuild APK in Android Studio

---

## 📋 **Troubleshooting**

### **Common Issues**

**Build Errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `npm run build -- --force`

**Android Build Issues:**
- Clean project in Android Studio
- Sync Gradle files
- Check Android SDK installation

**Image Loading Issues:**
- Verify images are in `public/images/`
- Check file names are exact (case-sensitive)
- Use browser dev tools to check network requests

**Login Issues:**
- Create new accounts through registration
- Check browser console for errors
- Clear localStorage if needed

---

## 📞 **Support**

### **Getting Help**
- Check browser console for errors
- Review Android Studio build logs
- Verify all dependencies are installed
- Ensure images are properly placed

### **Development Tips**
- Use `npm run dev` for development
- Test in browser before building Android
- Check responsive design on different screen sizes
- Verify all features work offline

---

## 🎯 **Production Ready**

This FarmTech application is production-ready with:
- ✅ Complete farming management system
- ✅ Cross-platform web and mobile support
- ✅ Admin and farmer role management
- ✅ Multi-language support
- ✅ Offline functionality
- ✅ Payment verification system
- ✅ File upload and management
- ✅ Responsive design
- ✅ Production build optimization

**Ready to deploy and use for real farming operations!** 🌾✨

---

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.