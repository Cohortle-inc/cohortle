# Design Document: Web Student Authentication and Dashboard

## Overview

This design document outlines the frontend architecture for implementing student authentication and dashboard functionality in the cohortle-web Next.js application. The system will provide a complete authentication flow (sign up, login, logout, password reset) and a hierarchical navigation system (Dashboard → Programme → Module → Lesson) that integrates with the existing lesson viewer.

The design leverages Next.js 14 App Router, TanStack Query for data fetching and caching, and Tailwind CSS for styling. All backend functionality already exists at https://api.cohortle.com - this design focuses exclusively on the frontend implementation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│  Public Routes          │  Protected Routes                  │
│  - /login               │  - /dashboard                      │
│  - /signup              │  - /programmes/[id]                │
│  - /forgot-password     │  - /modules/[id]                   │
│  - /reset-password      │  - /lessons/[id] (existing)        │
└─────────────────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐    ┌──────────────────────────┐
│  Auth Context       │    │  TanStack Query          │
│  - JWT Token        │    │  - Data Fetching         │
│  - User State       │    │  - Caching               │
│  - Auth Methods     │    │  - Optimistic Updates    │
└─────────────────────┘    └──────────────────────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
           ┌───────────────────────┐
           │   API Client Layer    │
           │   - Token Injection   │
           │   - Error Handling    │
           │   - Request/Response  │
           └───────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │  Backend API          │
           │  api.cohortle.com     │
           └───────────────────────┘
```

### Directory Structure

```
cohortle-web/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   ├── (protected)/               # Protected route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── programmes/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── modules/
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   └── lessons/                   # Existing lesson viewer
│   │       └── [lessonId]/
│   │           └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   └── LogoutButton.tsx
│   │   ├── dashboard/
│   │   │   ├── ProgrammeCard.tsx
│   │   │   ├── ProgrammeList.tsx
│   │   │   ├── WelcomeHeader.tsx
│   │   │   └── ContinueLearning.tsx
│   │   ├── programmes/
│   │   │   ├── ModuleCard.tsx
│   │   │   ├── ModuleList.tsx
│   │   │   └── ProgrammeHeader.tsx
│   │   ├── modules/
│   │   │   ├── LessonCard.tsx
│   │   │   ├── LessonList.tsx
│   │   │   └── ModuleHeader.tsx
│   │   └── ui/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── FormInput.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts              # Existing API client
│   │   │   ├── auth.ts                # Existing auth endpoints
│   │   │   ├── user.ts                # New user endpoints
│   │   │   └── programmes.ts          # New programme endpoints
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useUser.ts
│   │   │   ├── useProgrammes.ts
│   │   │   ├── useModules.ts
│   │   │   └── useLessons.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── utils/
│   │       ├── validation.ts
│   │       └── storage.ts
│   └── middleware.ts                  # Existing auth middleware
```

## Components and Interfaces

### 1. Authentication Context

The AuthContext provides global authentication state and methods throughout the application.

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
}

// Implementation
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from stored token
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      validateAndSetUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    storeToken(token);
    setUser(user);
  };

  const logout = async () => {
    await apiClient.post('/api/auth/logout');
    clearToken();
    setUser(null);
  };

  // ... other methods
}
```

### 2. API Client Layer

Extends the existing API client to handle authentication tokens and error responses.

```typescript
// lib/api/client.ts (extend existing)
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.cohortle.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject JWT token
apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Authentication API Functions

```typescript
// lib/api/auth.ts (extend existing)
export async function register(email: string, username: string, password: string) {
  const response = await apiClient.post('/api/auth/register', {
    email,
    username,
    password,
  });
  return response.data;
}

export async function login(email: string, password: string) {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  });
  return response.data;
}

export async function logout() {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post('/api/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string) {
  const response = await apiClient.post('/api/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
}
```

### 4. User Data API Functions

```typescript
// lib/api/user.ts (new file)
export async function getUserProfile() {
  const response = await apiClient.get('/api/user/profile');
  return response.data;
}

export async function getUserCommunities() {
  const response = await apiClient.get('/api/user/communities');
  return response.data;
}
```

### 5. Programme and Module API Functions

```typescript
// lib/api/programmes.ts (new file)
export async function getCommunityModules(communityId: string) {
  const response = await apiClient.get(`/api/communities/${communityId}/modules`);
  return response.data;
}

export async function getModuleLessons(moduleId: string) {
  const response = await apiClient.get(`/api/modules/${moduleId}/lessons`);
  return response.data;
}
```

### 6. TanStack Query Hooks

```typescript
// lib/hooks/useUser.ts
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserCommunities() {
  return useQuery({
    queryKey: ['user', 'communities'],
    queryFn: getUserCommunities,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// lib/hooks/useProgrammes.ts
export function useCommunityModules(communityId: string) {
  return useQuery({
    queryKey: ['communities', communityId, 'modules'],
    queryFn: () => getCommunityModules(communityId),
    enabled: !!communityId,
  });
}

// lib/hooks/useModules.ts
export function useModuleLessons(moduleId: string) {
  return useQuery({
    queryKey: ['modules', moduleId, 'lessons'],
    queryFn: () => getModuleLessons(moduleId),
    enabled: !!moduleId,
  });
}
```

### 7. Form Components

```typescript
// components/auth/LoginForm.tsx
interface LoginFormProps {
  onSuccess?: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await login(email, password);
      onSuccess?.();
      router.push('/dashboard');
    } catch (error) {
      setErrors({ form: 'Invalid email or password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormInput
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        disabled={isSubmitting}
      />
      <FormInput
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        disabled={isSubmitting}
      />
      {errors.form && <ErrorMessage message={errors.form} />}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>
      <Link href="/forgot-password">Forgot Password?</Link>
    </form>
  );
}
```

### 8. Dashboard Components

```typescript
// components/dashboard/ProgrammeCard.tsx
interface Programme {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  moduleCount: number;
  completedLessons: number;
  totalLessons: number;
}

function ProgrammeCard({ programme }: { programme: Programme }) {
  const progress = (programme.completedLessons / programme.totalLessons) * 100;

  return (
    <Link href={`/programmes/${programme.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition">
        {programme.thumbnail && (
          <img src={programme.thumbnail} alt={programme.name} />
        )}
        <h3>{programme.name}</h3>
        <p>{programme.description}</p>
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
        <p>{programme.moduleCount} modules</p>
      </div>
    </Link>
  );
}

// app/(protected)/dashboard/page.tsx
function DashboardPage() {
  const { user } = useAuth();
  const { data: communities, isLoading, error } = useUserCommunities();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load programmes" />;

  return (
    <div>
      <WelcomeHeader user={user} />
      <ContinueLearning />
      <ProgrammeList programmes={communities} />
    </div>
  );
}
```

### 9. Programme Detail Page

```typescript
// app/(protected)/programmes/[id]/page.tsx
function ProgrammePage({ params }: { params: { id: string } }) {
  const { data: modules, isLoading, error } = useCommunityModules(params.id);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load modules" />;

  return (
    <div>
      <ProgrammeHeader programme={modules.programme} />
      <ModuleList modules={modules.data} />
    </div>
  );
}
```

### 10. Module Detail Page

```typescript
// app/(protected)/modules/[id]/page.tsx
function ModulePage({ params }: { params: { id: string } }) {
  const { data: lessons, isLoading, error } = useModuleLessons(params.id);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load lessons" />;

  return (
    <div>
      <ModuleHeader module={lessons.module} />
      <LessonList lessons={lessons.data} />
    </div>
  );
}
```

### 11. Protected Route Middleware

```typescript
// middleware.ts (extend existing)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/programmes', '/modules', '/lessons'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth-only (redirect if already logged in)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    // Redirect to login and save intended destination
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    // Already logged in, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/programmes/:path*', '/modules/:path*', '/lessons/:path*', '/login', '/signup'],
};
```

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  profilePicture?: string;
  createdAt: string;
}
```

### Programme/Community Model

```typescript
interface Programme {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  moduleCount: number;
  completedLessons: number;
  totalLessons: number;
  enrolledAt: string;
}
```

### Module Model

```typescript
interface Module {
  id: string;
  name: string;
  description: string;
  lessonCount: number;
  completedLessons: number;
  order: number;
  communityId: string;
}
```

### Lesson Model

```typescript
interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'quiz' | 'link' | 'live_session';
  duration?: number;
  isCompleted: boolean;
  order: number;
  moduleId: string;
}
```

### Form Validation Models

```typescript
interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface ForgotPasswordFormData {
  email: string;
}

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ValidationError {
  field: string;
  message: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, several patterns of redundancy emerged:

1. **Email validation** (1.5, 2.6, 10.6) - These all test the same email validation logic and can be combined into one comprehensive property
2. **Route protection** (9.1, 9.2, 9.3, 9.4) - These all test the same protection mechanism on different routes and can be combined
3. **Data fetching patterns** (6.1, 7.1, 8.1, 14.1) - While these fetch different data, they follow the same pattern and can be validated by a single property about API calls
4. **List rendering** (6.2, 7.2, 8.2) - These all test rendering lists of items and can be combined
5. **Item detail display** (6.3, 7.3, 8.3) - These all test displaying required fields for items and can be combined
6. **Navigation behavior** (6.5, 7.4, 8.4) - These all test clicking items to navigate and can be combined
7. **Header display** (7.5, 8.5) - These test the same pattern of displaying parent information
8. **Token storage** (2.3, 2.7) - These are testing the same behavior
9. **Loading indicators** (11.1, 11.2) - These test the same loading state pattern
10. **Responsive layouts** (12.1, 12.2, 12.3) - These can be combined into one property about responsive behavior

Properties to write (after consolidation):
- Form validation (email, password, required fields)
- Authentication flow (login, signup, logout)
- Session persistence and token management
- Route protection for all protected routes
- Data fetching and display patterns
- Navigation between hierarchical views
- Error handling and loading states
- Password reset flow
- Integration with lesson viewer

### Correctness Properties

Property 1: Email validation consistency
*For any* string input to an email field, the validation function should reject inputs that don't match standard email format (contains @, has domain, no spaces) and accept inputs that do match the format
**Validates: Requirements 1.5, 2.6, 10.6**

Property 2: Password length validation
*For any* string input to a password field, the validation function should reject passwords with fewer than 8 characters and accept passwords with 8 or more characters
**Validates: Requirements 1.6, 10.7**

Property 3: Required field validation
*For any* form with required fields, submitting with any combination of empty required fields should prevent submission and highlight all missing fields
**Validates: Requirements 1.7, 10.8**

Property 4: Registration API call correctness
*For any* valid registration data (valid email, non-empty username, password ≥8 chars), submitting the signup form should trigger a POST request to /api/auth/register with the correct payload structure
**Validates: Requirements 1.2**

Property 5: Login API call correctness
*For any* valid credentials (valid email format, non-empty password), submitting the login form should trigger a POST request to /api/auth/login with the correct payload structure
**Validates: Requirements 2.2**

Property 6: Token storage after successful login
*For any* successful login response containing a JWT token, the authentication system should store the token in either a secure HTTP-only cookie or localStorage
**Validates: Requirements 2.3, 2.7**

Property 7: Post-login navigation
*For any* successful login, the system should redirect the user to either the dashboard or their originally intended destination if one was preserved
**Validates: Requirements 2.4, 9.6**

Property 8: Session persistence across page refreshes
*For any* page refresh while a valid JWT token is stored, the authentication system should retrieve the token and maintain the user's authenticated state without requiring re-login
**Validates: Requirements 3.1, 3.2, 3.5**

Property 9: Logout token cleanup
*For any* logout action (successful or failed), the system should clear the stored JWT token from storage and redirect to the login page
**Validates: Requirements 4.2, 4.3, 4.4**

Property 10: Logout button presence
*For any* authenticated page in the application, a logout button should be present and functional
**Validates: Requirements 4.5**

Property 11: Protected route redirection
*For any* protected route (/dashboard, /programmes/*, /modules/*, /lessons/*) accessed without a valid authentication token, the system should redirect to the login page and preserve the intended destination URL
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.7**

Property 12: Password reset API flow
*For any* valid email submitted to the forgot password form, the system should send a POST request to the password reset endpoint and display a confirmation message
**Validates: Requirements 5.2, 5.3**

Property 13: Password update completion
*For any* valid new password submitted via the reset password form, the system should send the update request to the API and redirect to login with a success message upon completion
**Validates: Requirements 5.5, 5.6**

Property 14: Data fetching on page load
*For any* page that requires data (dashboard, programme, module), navigating to that page should trigger the appropriate API call with the correct parameters (e.g., community ID, module ID)
**Validates: Requirements 6.1, 7.1, 8.1, 14.1**

Property 15: Complete list rendering
*For any* API response containing a list of items (programmes, modules, lessons), the view should render all items from the response without omission
**Validates: Requirements 6.2, 7.2, 8.2**

Property 16: Required item information display
*For any* item in a list (programme, module, lesson), the rendered card should include all required information fields (name/title, description, and type-specific metadata like lesson count or completion status)
**Validates: Requirements 6.3, 7.3, 8.3**

Property 17: Item click navigation
*For any* clickable item in a list (programme, module, lesson), clicking the item should navigate to the correct detail page with the correct ID in the URL
**Validates: Requirements 6.5, 7.4, 8.4, 13.1**

Property 18: Parent context display
*For any* detail page (programme, module), the page should display the parent entity's name and description in the header section
**Validates: Requirements 7.5, 8.5**

Property 19: User information display
*For any* logged-in user, the dashboard should display the user's name in the welcome message and show their email in the profile section
**Validates: Requirements 6.6, 14.2**

Property 20: Lesson completion status visibility
*For any* lesson in a module view, if the lesson has been completed by the user, it should be visually indicated as completed
**Validates: Requirements 8.6**

Property 21: Form submission loading state
*For any* form being submitted, the submit button should be disabled and display a loading indicator until the submission completes (success or failure)
**Validates: Requirements 10.4, 11.2**

Property 22: Data loading indicators
*For any* page fetching data from the API, a loading spinner or skeleton screen should be displayed until the data loads or an error occurs
**Validates: Requirements 11.1**

Property 23: Loading state cleanup
*For any* API call that completes (successfully or with error), all loading indicators should be removed from the UI
**Validates: Requirements 11.4, 11.5**

Property 24: Validation error display
*For any* form submission that fails validation, specific error messages should be displayed for each invalid field, and focus should be set to the first invalid field
**Validates: Requirements 10.1, 10.5**

Property 25: Authentication token injection
*For any* API request made while authenticated, the JWT token should be automatically included in the Authorization header
**Validates: Requirements 13.2**

Property 26: Responsive layout adaptation
*For any* viewport width (desktop ≥1024px, tablet 768-1023px, mobile ≤767px), the layout should adapt appropriately with multi-column layouts on desktop and single-column on mobile
**Validates: Requirements 12.1, 12.2, 12.3**

Property 27: Navigation accessibility across viewports
*For any* screen size, navigation elements (menu, logout button, back buttons) should remain accessible and functional
**Validates: Requirements 12.6**

Property 28: Lesson viewer integration
*For any* lesson accessed from the module view, the system should navigate to /lessons/[lessonId] with the correct lesson ID and maintain authentication context
**Validates: Requirements 13.1, 13.2, 13.3**

Property 29: Completion status synchronization
*For any* lesson marked as complete in the lesson viewer, the completion status should be reflected in the module view when the user returns
**Validates: Requirements 13.4**

Property 30: Profile picture conditional rendering
*For any* user profile, if a profile picture URL exists, it should be displayed; if not, a default avatar or initials should be shown instead
**Validates: Requirements 14.4**

## Error Handling

### Authentication Errors

1. **Invalid Credentials (401)**
   - Display: "Invalid email or password. Please try again."
   - Action: Clear password field, keep email populated
   - No indication of which field was incorrect (security)

2. **Duplicate Email/Username (409)**
   - Display: "An account with this email/username already exists."
   - Action: Highlight the conflicting field
   - Suggest: "Try logging in instead" with link to login page

3. **Expired Token (401)**
   - Action: Clear stored token
   - Redirect: To login page with message "Your session has expired. Please log in again."
   - Preserve: Intended destination for post-login redirect

4. **Invalid Token (401)**
   - Action: Clear stored token
   - Redirect: To login page
   - No message (silent failure for security)

### Network Errors

1. **Connection Timeout**
   - Display: "Unable to connect. Please check your internet connection and try again."
   - Action: Provide retry button
   - Preserve: Form data so user doesn't lose input

2. **Server Error (500)**
   - Display: "Something went wrong on our end. Please try again in a moment."
   - Action: Provide retry button
   - Log: Error details for debugging (client-side logging)

3. **Not Found (404)**
   - Display: "The requested resource was not found."
   - Action: Provide "Go to Dashboard" button
   - Log: URL that caused 404

### Validation Errors

1. **Client-Side Validation**
   - Trigger: On blur and on submit
   - Display: Inline error messages below each field
   - Style: Red border on invalid fields
   - Focus: First invalid field on submit attempt

2. **Server-Side Validation**
   - Display: Map server error messages to appropriate fields
   - Fallback: Generic form error if field mapping fails
   - Preserve: All user input

### Data Loading Errors

1. **Failed to Load Programmes/Modules/Lessons**
   - Display: Error message with retry button
   - Action: Retry button re-fetches data
   - Fallback: "Go to Dashboard" button if retry fails multiple times

2. **Empty States**
   - No programmes: "You're not enrolled in any programmes yet. Contact your instructor to get started."
   - No modules: "This programme doesn't have any modules yet."
   - No lessons: "This module doesn't have any lessons yet."

### Error Recovery Strategies

1. **Automatic Retry**
   - Network errors: Retry once automatically after 2 seconds
   - Exponential backoff for subsequent retries
   - Maximum 3 automatic retries

2. **Graceful Degradation**
   - If profile picture fails to load: Show initials
   - If thumbnail fails to load: Show placeholder image
   - If user name unavailable: Show email address

3. **Error Boundaries**
   - Catch React component errors
   - Display: "Something went wrong. Please refresh the page."
   - Log: Error stack trace for debugging
   - Provide: Refresh button

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both approaches are complementary and necessary for complete validation

### Unit Testing Focus

Unit tests should focus on:
- Specific authentication flow examples (successful login, failed login)
- Edge cases (empty states, expired tokens, network failures)
- Integration points (API client, middleware, context providers)
- Component rendering with specific props
- Error handling scenarios

Avoid writing too many unit tests for scenarios that property tests can cover (e.g., testing every possible invalid email format).

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for implementing property tests.

Each property test must:
- Run minimum 100 iterations (due to randomization)
- Reference its design document property number
- Use tag format: **Feature: web-student-auth-dashboard, Property {number}: {property_text}**

Example property test structure:

```typescript
// __tests__/auth/emailValidation.pbt.ts
import fc from 'fast-check';
import { validateEmail } from '@/lib/utils/validation';

describe('Feature: web-student-auth-dashboard, Property 1: Email validation consistency', () => {
  it('should reject invalid email formats and accept valid ones', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (validEmail) => {
          expect(validateEmail(validEmail)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')),
        (invalidEmail) => {
          expect(validateEmail(invalidEmail)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

1. **Authentication Flow**
   - Unit tests: Successful login, failed login, logout
   - Property tests: Token storage, session persistence, route protection

2. **Form Validation**
   - Unit tests: Specific validation examples
   - Property tests: Email validation, password validation, required fields

3. **Data Fetching and Display**
   - Unit tests: Successful data load, error states, empty states
   - Property tests: Complete list rendering, required field display

4. **Navigation**
   - Unit tests: Specific navigation examples
   - Property tests: Item click navigation, route protection

5. **Error Handling**
   - Unit tests: All error scenarios (401, 404, 500, network errors)
   - Property tests: Error message display, loading state cleanup

6. **Responsive Design**
   - Unit tests: Specific breakpoint examples
   - Property tests: Layout adaptation across viewport sizes

### Integration Testing

Integration tests should verify:
- Complete authentication flow (signup → login → dashboard → logout)
- Navigation flow (dashboard → programme → module → lesson)
- Session persistence across page refreshes
- Protected route middleware behavior
- API client token injection

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **fast-check**: Property-based testing
- **MSW (Mock Service Worker)**: API mocking
- **next/router mock**: Navigation testing

### Test Organization

```
__tests__/
├── auth/
│   ├── login.test.tsx
│   ├── signup.test.tsx
│   ├── logout.test.tsx
│   ├── passwordReset.test.tsx
│   ├── emailValidation.pbt.ts
│   ├── passwordValidation.pbt.ts
│   └── sessionPersistence.pbt.ts
├── dashboard/
│   ├── programmeList.test.tsx
│   ├── programmeList.pbt.ts
│   └── welcomeHeader.test.tsx
├── programmes/
│   ├── moduleList.test.tsx
│   └── moduleList.pbt.ts
├── modules/
│   ├── lessonList.test.tsx
│   └── lessonList.pbt.ts
├── middleware/
│   ├── authMiddleware.test.ts
│   └── routeProtection.pbt.ts
└── integration/
    ├── authFlow.test.tsx
    └── navigationFlow.test.tsx
```

## Implementation Notes

### Security Considerations

1. **Token Storage**
   - Prefer HTTP-only cookies over localStorage for XSS protection
   - Set secure flag in production
   - Set SameSite=Strict to prevent CSRF

2. **Password Handling**
   - Never log passwords
   - Clear password fields after failed attempts
   - Use type="password" for all password inputs
   - Don't reveal which field (email/password) was incorrect on login failure

3. **API Communication**
   - Always use HTTPS in production
   - Validate all API responses
   - Sanitize user input before display
   - Implement rate limiting on auth endpoints (backend responsibility)

### Performance Optimizations

1. **Data Caching**
   - Cache user profile for 5 minutes
   - Cache programme list for 2 minutes
   - Cache module/lesson lists for 1 minute
   - Invalidate cache on mutations

2. **Code Splitting**
   - Lazy load dashboard components
   - Lazy load programme/module detail pages
   - Preload next likely navigation (e.g., preload programme page when hovering over programme card)

3. **Image Optimization**
   - Use Next.js Image component for thumbnails and profile pictures
   - Implement lazy loading for images below the fold
   - Provide appropriate image sizes for different viewports

4. **Loading States**
   - Show skeleton screens instead of spinners for better perceived performance
   - Implement optimistic updates where appropriate
   - Prefetch data on hover for instant navigation

### Accessibility

1. **Keyboard Navigation**
   - All interactive elements must be keyboard accessible
   - Implement proper tab order
   - Provide skip links for main content

2. **Screen Readers**
   - Use semantic HTML elements
   - Provide ARIA labels for icon buttons
   - Announce loading states and errors
   - Use proper heading hierarchy

3. **Focus Management**
   - Focus first invalid field on validation error
   - Return focus to trigger element when closing modals
   - Provide visible focus indicators

4. **Color and Contrast**
   - Ensure WCAG AA contrast ratios
   - Don't rely solely on color to convey information
   - Provide text alternatives for icons

### Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum versions: Last 2 major versions
- Polyfills: None required (Next.js handles this)
- Progressive enhancement: Core functionality works without JavaScript (where possible)

### Mobile Considerations

- Touch targets: Minimum 44x44px
- Viewport meta tag: Properly configured
- Responsive images: Appropriate sizes for mobile
- Performance: Minimize bundle size for mobile networks
