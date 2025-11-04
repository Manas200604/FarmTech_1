# Admin Setup Guide for FarmTech

## Current Admin Configuration

✅ **Admin Secret Code**: `admin123` (configured in .env)
✅ **Admin Registration**: Available at `/register` with admin role selection
✅ **Admin Dashboard**: Available at `/admin` for admin users
✅ **Role-based Access**: Implemented throughout the application

## How to Create an Admin User

### Method 1: Through the Application (Recommended)

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Navigate to Registration**:
   - Go to `http://localhost:3000/register`
   - Fill in the registration form
   - Select "Admin" as the role
   - Enter the admin secret code: `admin123`
   - Complete registration

3. **Verify Admin Access**:
   - Log in with the created admin credentials
   - You should be redirected to `/admin` (Admin Dashboard)
   - Verify you can access admin-only features

### Method 2: Direct Database Creation (If needed)

If you have direct access to your Supabase dashboard:

1. **Create User in Auth**:
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Set user metadata: `{"name": "Admin Name", "role": "admin"}`

2. **Create Profile Record**:
   - Go to Supabase Dashboard → Table Editor → profiles
   - Insert new row:
     ```sql
     INSERT INTO profiles (id, email, name, role, created_at, updated_at)
     VALUES (
       '[user-id-from-auth]',
       'admin@example.com',
       'Admin Name',
       'admin',
       NOW(),
       NOW()
     );
     ```

## Admin Features Available

Once logged in as admin, you can access:

- **Admin Dashboard** (`/admin`): Overview of system statistics
- **Materials Management**: Add, edit, and manage materials inventory
- **Order Management**: Review and approve farmer orders
- **Payment Review**: Approve or reject payment requests
- **Upload Management**: View and manage all user uploads
- **User Management**: View all registered users

## Admin Role Verification

The system checks for admin role in several ways:

1. **Route Protection**: Admin routes check `userProfile?.role === 'admin'`
2. **Component Rendering**: Admin-only components check user role
3. **API Access**: Backend operations verify admin permissions
4. **Navigation**: Admin-specific navigation items appear for admin users

## Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_ADMIN_SECRET_CODE=admin123
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### "Not authorized" errors:
- Verify the user's role is set to 'admin' in the profiles table
- Check that the user is properly authenticated
- Ensure the admin secret code matches during registration

### Cannot access admin dashboard:
- Verify user role in database: `SELECT * FROM profiles WHERE role = 'admin'`
- Check browser console for authentication errors
- Try logging out and logging back in

### Registration with admin code fails:
- Verify `VITE_ADMIN_SECRET_CODE` is set in .env
- Ensure the code entered matches exactly (case-sensitive)
- Check browser network tab for API errors

## Security Notes

- The admin secret code (`admin123`) should be changed in production
- Admin users have full access to all system data
- Consider implementing additional admin verification steps for production
- Regularly audit admin user accounts

## Next Steps

1. Create your first admin user using Method 1 above
2. Test admin functionality by logging in
3. Change the admin secret code for production use
4. Set up additional admin users as needed

---

**Need Help?** Check the application logs or browser console for specific error messages.