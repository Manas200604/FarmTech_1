# Design Document

## Overview

This design document outlines the comprehensive migration strategy for converting the FarmTech web application from Firebase to Supabase. The migration will transform the NoSQL Firestore database to a relational PostgreSQL database, replace Firebase Auth with Supabase Auth, and migrate Firebase Storage to Supabase Storage while maintaining all existing functionality.

## Architecture

### Current Firebase Architecture
- **Frontend**: React + Tailwind CSS SPA
- **Authentication**: Firebase Auth with email/password
- **Database**: Firestore (NoSQL document database)
- **Storage**: Firebase Storage for crop images
- **Security**: Firestore security rules

### Target Supabase Architecture
- **Frontend**: React + Tailwind CSS SPA (unchanged)
- **Authentication**: Supabase Auth with email/password
- **Database**: PostgreSQL with relational tables
- **Storage**: Supabase Storage for crop images
- **Security**: Row Level Security (RLS) policies

## Components and Interfaces

### 1. Database Schema Migration

#### PostgreSQL Table Structure
Based on the provided schema, the following tables will be created:

**Users Table**
```sql
users (
  id uuid primary key,
  name text,
  email text unique,
  phone text,
  role text check (role in ('farmer', 'admin')),
  farm_location text,
  crop_type text,
  created_at timestamptz
)
```

**Uploads Table**
```sql
uploads (
  id uuid primary key,
  user_id uuid references users(id),
  image_url text,
  description text,
  crop_type text,
  status text default 'pending',
  admin_feedback text,
  created_at timestamptz
)
```

**Schemes Table**
```sql
schemes (
  id uuid primary key,
  title text,
  description text,
  eligibility text,
  documents jsonb,
  government_link text,
  created_by uuid references users(id),
  created_at timestamptz
)
```

**Contacts Table**
```sql
contacts (
  id uuid primary key,
  name text,
  specialization text,
  crop_type text,
  contact_info text,
  region text
)
```

**Pesticides Table**
```sql
pesticides (
  id uuid primary key,
  name text,
  crop_type text,
  description text,
  recommended_usage text,
  price_range text
)
```

**Stats Table**
```sql
stats (
  id uuid primary key,
  total_users int,
  total_uploads int,
  total_schemes int,
  last_updated timestamptz
)
```

### 2. Authentication System Design

#### Supabase Auth Integration
- Replace Firebase Auth with Supabase Auth client
- Maintain email/password authentication flow
- Preserve user roles through custom user metadata
- Implement session management using Supabase Auth state

#### Authentication Flow
1. User registration creates entry in both Supabase Auth and users table
2. Login authenticates through Supabase Auth
3. User profile data retrieved from users table
4. Role-based access controlled through RLS policies

### 3. Storage Migration Design

#### Supabase Storage Structure
- Create 'uploads' bucket in Supabase Storage
- Organize files by user ID: `user_{user_id}/{filename}`
- Maintain existing file naming conventions
- Update image URLs to point to Supabase Storage

#### File Migration Process
1. Download all files from Firebase Storage
2. Upload files to Supabase Storage with same structure
3. Update image_url fields in uploads table
4. Verify file accessibility and permissions

### 4. API Layer Transformation

#### Supabase Client Configuration
```typescript
// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)
```

#### Query Transformation Examples
**Firebase to Supabase Query Mapping:**

Firebase Firestore:
```javascript
const querySnapshot = await getDocs(collection(db, 'schemes'))
```

Supabase PostgreSQL:
```javascript
const { data, error } = await supabase.from('schemes').select('*')
```

### 5. Row Level Security (RLS) Design

#### Security Policy Implementation
The RLS policies will enforce the same access controls as Firebase security rules:

**User Data Access:**
- Users can view and update their own profile
- Admins can manage all user data

**Upload Access:**
- Users can create uploads linked to their account
- Users can view their own uploads
- Admins can view and update all uploads

**Public Data Access:**
- All users can read schemes, contacts, and pesticides
- Only admins can modify public data

## Data Models

### 1. User Model
```typescript
interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'farmer' | 'admin'
  farm_location?: string
  crop_type?: string
  created_at: string
}
```

### 2. Upload Model
```typescript
interface Upload {
  id: string
  user_id: string
  image_url: string
  description: string
  crop_type: string
  status: 'pending' | 'reviewed'
  admin_feedback?: string
  created_at: string
}
```

### 3. Scheme Model
```typescript
interface Scheme {
  id: string
  title: string
  description: string
  eligibility: string
  documents: Array<{name: string, description: string}>
  government_link: string
  created_by: string
  created_at: string
}
```

## Error Handling

### 1. Database Error Handling
- Implement try-catch blocks for all Supabase queries
- Handle PostgreSQL constraint violations gracefully
- Provide user-friendly error messages for common failures
- Log detailed errors for debugging purposes

### 2. Authentication Error Handling
- Handle Supabase Auth errors (invalid credentials, network issues)
- Implement proper session expiry handling
- Provide clear feedback for authentication failures
- Maintain authentication state consistency

### 3. Storage Error Handling
- Handle file upload failures with retry logic
- Validate file types and sizes before upload
- Provide progress feedback for large file uploads
- Handle storage quota and permission errors

## Testing Strategy

### 1. Unit Testing
- Test individual Supabase query functions
- Test authentication helper functions
- Test data transformation utilities
- Test RLS policy enforcement

### 2. Integration Testing
- Test complete user registration and login flows
- Test image upload and retrieval processes
- Test CRUD operations for all data entities
- Test admin functionality and permissions

### 3. Migration Testing
- Verify data integrity after migration
- Test that all existing functionality works
- Validate that user sessions remain active
- Confirm that file URLs are accessible

### 4. Security Testing
- Test RLS policies with different user roles
- Verify that unauthorized access is blocked
- Test authentication token handling
- Validate data isolation between users

## Migration Implementation Strategy

### Phase 1: Environment Setup
1. Create Supabase project and configure settings
2. Set up PostgreSQL database with schema
3. Create storage bucket and configure policies
4. Set up development environment with Supabase

### Phase 2: Code Transformation
1. Install Supabase client library
2. Replace Firebase imports with Supabase client
3. Transform all database queries from Firestore to PostgreSQL
4. Update authentication flows to use Supabase Auth
5. Modify storage operations for Supabase Storage

### Phase 3: Data Migration
1. Export all data from Firebase collections
2. Transform data format for PostgreSQL tables
3. Import data into Supabase database
4. Migrate files from Firebase Storage to Supabase Storage
5. Update file URLs in database

### Phase 4: Testing and Validation
1. Run comprehensive test suite
2. Validate all user flows work correctly
3. Verify data integrity and completeness
4. Test security policies and access controls
5. Performance testing and optimization

### Phase 5: Deployment
1. Deploy updated application to production
2. Update environment variables and configuration
3. Monitor application performance and errors
4. Provide user communication about the migration