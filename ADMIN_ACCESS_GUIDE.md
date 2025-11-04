# Admin Access Guide

## 🛡️ Admin Portal Access

### Method 1: Direct URL Access
Navigate to: `http://localhost:5173/admin-portal`

### Method 2: From Main Login Page
1. Go to the main login page
2. Click "🛡️ Admin Portal" button at the bottom
3. Enter admin credentials

### Method 3: Legacy Access (Still Available)
- `http://localhost:5173/admin-login` - Original admin login
- `http://localhost:5173/red-admin` - Red admin access

## 🔑 Admin Credentials
```
Email: admin@farmtech.com
Password: FarmTech@2024
```

## 📊 Admin Dashboard Features

### After Login, You Can Access:
1. **Upload Reviews** - `/admin/uploads`
   - View all farmer uploads
   - Approve/reject submissions
   - See crop images and descriptions

2. **Order Management** - `/admin/orders`
   - View all orders with transaction IDs
   - Track payment status
   - Manage order fulfillment

3. **User Management** - `/admin/users`
   - View all registered farmers
   - Manage user accounts
   - User statistics

4. **Scheme Management** - `/admin/schemes`
   - Manage government schemes
   - Add/edit scheme details
   - Track scheme applications

## 🔧 Troubleshooting

### If Orders/Uploads Don't Show:
1. **Create Sample Data** (for testing):
   ```bash
   node create-sample-admin-data.js
   ```

2. **Check Database Connection**:
   - Verify Supabase credentials in `.env`
   - Check browser console for errors

3. **Verify Admin Authentication**:
   - Make sure you're logged in as admin
   - Check session storage for `isAdmin=true`

### Common Issues:
- **Empty Admin Panel**: Run sample data script
- **Login Failed**: Check credentials in `.env` file
- **Database Errors**: Verify Supabase connection

## 🚀 Quick Start
1. Navigate to `/admin-portal`
2. Login with: `admin@farmtech.com` / `FarmTech@2024`
3. Access admin dashboard
4. If no data shows, run: `node create-sample-admin-data.js`

## 📱 UI Separation
- **Farmers**: Use `/dashboard` or `/farmer` routes
- **Admins**: Use `/admin-portal` → `/red-admin-dashboard`
- **Clear Separation**: Different themes and interfaces

## 🔒 Security Features
- Environment-based credentials
- Session timeout (24 hours)
- Secure admin-only routes
- Protected admin functions

## 📞 Support
If you encounter issues:
1. Check browser console for errors
2. Verify environment variables
3. Test with sample data
4. Check network connectivity to Supabase