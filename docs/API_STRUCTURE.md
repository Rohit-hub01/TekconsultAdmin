# API Structure Refactoring

## Overview
Refactored the monolithic `api.ts` file into a modular structure following standard practices for better maintainability and scalability.

## New File Structure

```
src/lib/api/
├── endpoints.ts        # API endpoint URLs and constants
├── types.ts           # TypeScript interfaces and types
├── backendService.ts  # Backend API service functions
└── index.ts           # Barrel export file
```

---

## File Descriptions

### 1. [endpoints.ts](file:///d:/tekconsult-guardian/src/lib/api/endpoints.ts)
**Purpose**: Centralize all API endpoint URLs

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/Account/login-with-email',
  },
  ADMIN: {
    GET_ALL_USERS: '/api/Account/admin/get-all-users',
  },
  // ... other endpoints
} as const;
```

**Benefits**:
- Single source of truth for all API URLs
- Easy to update endpoints without touching service logic
- Type-safe endpoint references

---

### 2. [types.ts](file:///d:/tekconsult-guardian/src/lib/api/types.ts)
**Purpose**: Define all TypeScript interfaces and types

**Includes**:
- `BackendApiResponse<T>` - Wrapper for backend responses
- `BackendConsultantData` - Backend user/consultant data structure
- `Consultant` - Frontend consultant interface
- `User` - Frontend user interface
- `Category`, `Transaction`, `Withdrawal`, `Dispute`, etc.
- Request parameter interfaces (`GetUsersParams`, `GetConsultantsParams`)

**Benefits**:
- Centralized type definitions
- Easy to maintain and update interfaces
- Better IDE autocomplete and type checking

---

### 3. [backendService.ts](file:///d:/tekconsult-guardian/src/lib/api/backendService.ts)
**Purpose**: Backend API service functions

**Functions**:
- `getConsultantsFromBackend(skip, take)` - Fetch consultants
- `getUsersFromBackend(skip, take)` - Fetch users

**Features**:
- Data transformation from backend to frontend format
- Proper error handling
- JSDoc documentation
- Type-safe responses

**Benefits**:
- Separation of concerns
- Reusable service functions
- Easy to test and mock

---

### 4. [index.ts](file:///d:/tekconsult-guardian/src/lib/api/index.ts)
**Purpose**: Barrel export file for clean imports

```typescript
export * from './types';
export * from './endpoints';
export * from './backendService';
```

**Benefits**:
- Clean import statements in consuming files
- Single import point for all API-related exports

---

## Usage Examples

### Before Refactoring
```typescript
import { api, Consultant } from "@/lib/api";

const data = await api.getConsultantsFromBackend(0, 100);
```

### After Refactoring
```typescript
import { getConsultantsFromBackend, type Consultant } from "@/lib/api";

const data = await getConsultantsFromBackend(0, 100);
```

**Or import multiple items**:
```typescript
import { 
  getConsultantsFromBackend, 
  getUsersFromBackend,
  type Consultant, 
  type User,
  ENDPOINTS 
} from "@/lib/api";
```

---

## Benefits of This Structure

### 1. **Maintainability**
- Each file has a single responsibility
- Easy to locate and update specific functionality
- Reduces merge conflicts in team environments

### 2. **Scalability**
- Easy to add new services without bloating existing files
- Can create separate service files for different domains (e.g., `authService.ts`, `paymentService.ts`)

### 3. **Testability**
- Individual service functions can be tested in isolation
- Easy to mock endpoints and types for testing

### 4. **Developer Experience**
- Better IDE autocomplete
- Clearer code organization
- Easier onboarding for new developers

### 5. **Type Safety**
- Centralized type definitions prevent inconsistencies
- Compile-time error checking for API calls

---

## Migration Notes

### Backward Compatibility
The main `api.ts` file still exists and re-exports everything from the new structure:

```typescript
// In api.ts
export * from './api/types';
export * from './api/endpoints';
export * from './api/backendService';

// Legacy api object still available
export const api = { ... };
```

This means existing imports will continue to work without changes.

### Updated Files
- ✅ [Consultants.tsx](file:///d:/tekconsult-guardian/src/pages/Consultants.tsx) - Updated to use `getConsultantsFromBackend`
- ✅ [UsersPage.tsx](file:///d:/tekconsult-guardian/src/pages/UsersPage.tsx) - Updated to use `getUsersFromBackend`

---

## Future Improvements

### Recommended Next Steps
1. **Create more service files**:
   - `authService.ts` - Authentication functions
   - `categoryService.ts` - Category management
   - `sessionService.ts` - Session management
   - `transactionService.ts` - Transaction operations

2. **Add API client configuration**:
   - Create an axios/fetch wrapper with interceptors
   - Add request/response logging
   - Implement retry logic

3. **Environment-specific endpoints**:
   - Separate dev, staging, and production endpoints
   - Environment-specific configuration

4. **API versioning**:
   - Support multiple API versions
   - Graceful migration between versions

---

## File Locations

- **Endpoints**: `src/lib/api/endpoints.ts`
- **Types**: `src/lib/api/types.ts`
- **Backend Service**: `src/lib/api/backendService.ts`
- **Index**: `src/lib/api/index.ts`
- **Legacy API**: `src/lib/api.ts` (re-exports from api folder)
