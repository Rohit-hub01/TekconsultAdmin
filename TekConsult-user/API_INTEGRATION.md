# API Integration Documentation

This document explains the API integration structure and best practices used in this project.

## Project Structure

```
src/
├── constants/
│   └── endpoints.ts          # All API endpoint paths
├── services/
│   └── api.ts                # API service implementations
└── pages/
    └── user/
        └── UserHome.tsx      # Page consuming API
```

## Configuration Files

### `.env` - Environment Variables
Local environment configuration (not committed to git)
```env
VITE_API_BASE_URL=http://localhost:5041/api
```

### `.env.example` - Environment Template
Template showing required environment variables (committed to git)
```env
VITE_API_BASE_URL=http://localhost:5041/api
```

## How It Works

### 1. Environment Variables (`import.meta.env`)
- Exposed via Vite with `VITE_` prefix
- Loaded from `.env` file
- Development: `http://localhost:5041/api`
- Production: Configure via deployment platform

### 2. API Endpoints (`@/constants/endpoints.ts`)
All endpoint paths are centralized and organized by resource:

```typescript
// Category Endpoints
export const CATEGORY_ENDPOINTS = {
  GET_ALL: '/Category/get-all-categories',
  GET_BY_ID: (id: string) => `/Category/get-category/${id}`,
  // ...
}

// Consultant Endpoints
export const CONSULTANT_ENDPOINTS = {
  GET_ALL: '/Consultant/get-all-consultants',
  // ...
}

// Access all endpoints
import { API_ENDPOINTS } from '@/constants/endpoints';
```

### 3. API Service (`@/services/api.ts`)
Service layer that implements API calls using endpoints:

```typescript
import { API_BASE_URL } from '@/services/api';
import { CATEGORY_ENDPOINTS } from '@/constants/endpoints';

export const categoryAPI = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}${CATEGORY_ENDPOINTS.GET_ALL}`);
    return response.json();
  }
}
```

### 4. Component Usage
Pages/components consume the service:

```typescript
import { categoryAPI } from '@/services/api';

const UserHome = () => {
  useEffect(() => {
    const data = await categoryAPI.getAllCategories();
    setCategories(data);
  }, []);
}
```

## Benefits of This Structure

✅ **Single Source of Truth** - Endpoints defined once, reused everywhere
✅ **Easy Updates** - Change endpoint one place, affects entire app
✅ **Type Safety** - TypeScript interfaces for all API responses
✅ **Centralized Error Handling** - All API errors in one service layer
✅ **Environment Management** - Easy switching between dev/staging/prod
✅ **Maintainability** - Clear separation of concerns
✅ **Scalability** - Easy to add new endpoints and services

## Adding New Endpoints

1. **Add endpoint path** in `src/constants/endpoints.ts`:
```typescript
export const REVIEW_ENDPOINTS = {
  GET_BY_CONSULTANT: (id: string) => `/Review/consultant/${id}`,
  CREATE: '/Review/create',
}
```

2. **Create API method** in `src/services/api.ts`:
```typescript
export const reviewAPI = {
  getByConsultant: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}${REVIEW_ENDPOINTS.GET_BY_CONSULTANT(id)}`);
    return response.json();
  }
}
```

3. **Use in component**:
```typescript
import { reviewAPI } from '@/services/api';
const reviews = await reviewAPI.getByConsultant(consultantId);
```

## Environment Setup

### For New Developers
1. Copy `.env.example` to `.env`
2. Update values as needed for your environment
3. `.env` is in `.gitignore`, won't be committed

### Deployment
Set environment variables in your hosting platform:
- Vercel: Dashboard → Settings → Environment Variables
- GitHub Pages: Secrets & variables
- Docker: Pass as build args or runtime env
- Any provider: Follow their environment variable documentation

## API Response Types

```typescript
// Generic API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Specific Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
}
```

## Error Handling

All API methods include error handling:

```typescript
try {
  const data = await categoryAPI.getAllCategories();
  return data;
} catch (error) {
  console.error('Error fetching:', error);
  throw error; // Re-throw for component to handle
}
```

Components should handle errors with toast notifications:

```typescript
try {
  const data = await categoryAPI.getAllCategories();
} catch (error) {
  toast({
    title: 'Error',
    description: 'Failed to load categories',
    variant: 'destructive',
  });
}
```

## Authentication Flow (OTP-Based Login)

This application uses a two-step OTP-based authentication flow for phone number login.

### Flow Diagram

```
User Input (Phone + Country Code)
         ↓
    generateOTP()  [GET /Account/generate-otp]
         ↓
    User receives OTP (SMS/Email)
         ↓
    User enters OTP
         ↓
    loginWithPhone()  [POST /Account/login-with-phone]
         ↓
    User authenticated + JWT Token received
```

### Step 1: Generate OTP

**Endpoint:** `GET /Account/generate-otp`

**Requirements:**
- Bearer token in Authorization header
- No request body needed

**Usage:**
```typescript
import { authAPI } from '@/services/api';

const token = 'your_bearer_token_here';
try {
  const result = await authAPI.generateOTP(token);
  console.log('OTP generated successfully');
  // Show OTP input form to user
} catch (error) {
  toast({
    title: 'Error',
    description: 'Failed to generate OTP. Please try again.',
    variant: 'destructive',
  });
}
```

### Step 2: Login with Phone + OTP

**Endpoint:** `POST /Account/login-with-phone`

**Request Body:**
```json
{
  "countryCode": "string",
  "phoneNumber": "string",
  "otp": "string"
}
```

**Requirements:**
- Bearer token in Authorization header
- Content-Type: application/json

**Usage:**
```typescript
import { authAPI } from '@/services/api';

const token = 'your_bearer_token_here';
try {
  const result = await authAPI.loginWithPhone(
    token,
    '+91',           // countryCode
    '9504477090',    // phoneNumber
    '123456'         // otp
  );
  
  // Store the returned JWT token
  localStorage.setItem('authToken', result.token);
  
  // Redirect to home
  navigate('/user/home');
} catch (error) {
  toast({
    title: 'Invalid OTP',
    description: 'The OTP you entered is incorrect.',
    variant: 'destructive',
  });
}
```

### Authentication Endpoints in Constants

```typescript
export const AUTH_ENDPOINTS = {
  GENERATE_OTP: '/Account/generate-otp',           // Step 1
  LOGIN_WITH_PHONE: '/Account/login-with-phone',   // Step 2
  LOGIN: '/Auth/login',                             // Alternative email/password login
  REGISTER: '/Auth/register',
  LOGOUT: '/Auth/logout',
  VERIFY_OTP: '/Auth/verify-otp',
  RESEND_OTP: '/Auth/resend-otp',
  REFRESH_TOKEN: '/Auth/refresh-token',
  FORGOT_PASSWORD: '/Auth/forgot-password',
  RESET_PASSWORD: '/Auth/reset-password',
} as const;
```

### Token Management

Tokens are stored in localStorage and used for:
- Subsequent API calls via Authorization header
- Maintaining user session
- Checking authentication status in AuthContext

**Example usage in components:**
```typescript
const token = localStorage.getItem('authToken');
if (token) {
  // User is authenticated
  const result = await authAPI.generateOTP(token);
}
```

### Common Issues

**Issue:** "Unauthorized" error when calling generateOTP
- **Cause:** Bearer token missing or expired
- **Solution:** Ensure you have a valid token before calling generateOTP

**Issue:** "Invalid OTP" when logging in
- **Cause:** User entered wrong OTP or it has expired
- **Solution:** Request a new OTP by calling generateOTP again

**Issue:** CORS errors
- **Cause:** Backend not configured for frontend domain
- **Solution:** Check backend CORS settings in .NET configuration
