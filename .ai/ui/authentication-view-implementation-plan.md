# View Implementation Plan: Authentication (Login/Register)

## 1. Overview

This document outlines the implementation plan for the authentication views, which include the Login and Register pages. These views will allow users to sign in to their existing accounts or create new ones using their email and password. The authentication process will be handled by Supabase Auth. The UI will be built with React and Shadcn/ui components within an Astro project.

## 2. View Routing

- **/login**: The page where existing users can sign in.
- **/register**: The page where new users can create an account.

## 3. Component Structure

The authentication views will be built around a single, reusable React component.

```
/src/pages/login.astro
└── /src/components/AuthForm.tsx
    ├── @/components/ui/card
    ├── @/components/ui/label
    ├── @/components/ui/input
    └── @/components/ui/button

/src/pages/register.astro
└── /src/components/AuthForm.tsx
    ├── @/components/ui/card
    ├── @/components/ui/label
    ├── @/components/ui/input
    └── @/components/ui/button
```

## 4. Component Details

### `AuthForm.tsx`

- **Component Description**: A client-side React component that renders a form for either login or registration. It handles user input, form submission, and communication with Supabase Auth. The component's behavior is determined by a `mode` prop.
- **Main Elements**:
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` to structure the form.
  - `form` element to handle submission.
  - `Label` for accessible input labeling.
  - `Input` for email and password fields.
  - `Button` for form submission.
  - A paragraph (`<p>`) to display error messages.
  - A link to navigate between the login and register pages.
- **Handled Interactions**:
  - Updates state on input field changes.
  - On form submission, it calls the appropriate Supabase Auth function (`signInWithPassword` or `signUp`).
  - Displays a loading state on the button during submission.
- **Handled Validation**:
  - **Email**: Must be a valid email format. The input type will be `email`.
  - **Password**: Must meet Supabase's security requirements (e.g., minimum length of 6 characters). The input type will be `password`.
- **Types**:
  - `AuthFormProps`
  - `AuthFormData`
- **Props**:
  - `mode: 'login' | 'register'`: Determines whether the form is for logging in or registering.

## 5. Types

### `AuthFormProps`

This interface defines the props for the `AuthForm` component.

```typescript
interface AuthFormProps {
  mode: "login" | "register";
}
```

### `AuthFormData`

This interface defines the structure for the form's state.

```typescript
interface AuthFormData {
  email: string;
  password: string;
}
```

## 6. State Management

State will be managed within the `AuthForm.tsx` component using React hooks.

- **Form Data**: `const [formData, setFormData] = useState<AuthFormData>({ email: '', password: '' });`
  - Manages the values of the email and password input fields.
- **Loading State**: `const [isLoading, setIsLoading] = useState<boolean>(false);`
  - Tracks the form's submission status to provide user feedback (e.g., disabling the button).
- **Error State**: `const [error, setError] = useState<string | null>(null);`
  - Stores any error messages returned from Supabase Auth to display them to the user.

A custom hook is not necessary for this view as the state is simple and localized to a single component.

## 7. API Integration

Authentication will be handled by the Supabase client library.

- **Supabase Client**: A Supabase client instance will be imported from `src/db/supabase.client.ts` into the `AuthForm.tsx` component.
- **Login**:
  - **Function**: `supabase.auth.signInWithPassword(formData)`
  - **Request**: The function takes an object with `email` and `password`.
  - **Response**: On success, it returns a user session, and the user is redirected. On failure, it returns an error object.
- **Registration**:
  - **Function**: `supabase.auth.signUp(formData)`
  - **Request**: The function takes an object with `email` and `password`.
  - **Response**: On success, it creates a new user, logs them in, and returns a session. On failure (e.g., user already exists), it returns an error object.

After a successful login or registration, the user will be redirected to the dashboard (`/`) or the onboarding page if it's their first time.

## 8. User Interactions

- **Typing in Fields**: The `onChange` event on the `Input` components will update the `formData` state.
- **Submitting the Form**:
  - The user clicks the "Login" or "Create Account" button.
  - The `onSubmit` event handler on the `form` is triggered.
  - `isLoading` is set to `true`, and the button is disabled.
  - The appropriate Supabase Auth function is called.
  - If successful, the page redirects to the dashboard.
  - If an error occurs, `isLoading` is set to `false`, and the `error` state is updated with the message from Supabase.
- **Toggling Forms**: A link will be present to navigate between `/login` and `/register`.

## 9. Conditions and Validation

- **Client-Side**:
  - The form submission button will be disabled while `isLoading` is `true`.
  - HTML5 validation attributes (`type="email"`, `required`) will be used on input fields for basic validation.
- **Server-Side (via Supabase)**:
  - Supabase handles the core validation:
    - Checks if the email is already in use during registration.
    - Verifies that the email and password match an existing user during login.
    - Enforces password strength policies.
  - The component will display any errors returned from Supabase.

## 10. Error Handling

- **Invalid Credentials**: If Supabase returns an "Invalid login credentials" error, the message "Invalid email or password." will be displayed below the form.
- **User Already Exists**: If Supabase returns an error indicating the user already exists, the message "A user with this email already exists." will be displayed.
- **Network/Other Errors**: A generic error message like "An unexpected error occurred. Please try again." will be shown for other types of errors.
- The `error` state will be cleared whenever the user starts typing in a field again to provide a better user experience.

## 11. Implementation Steps

1.  **Create `AuthForm.tsx`**:
    - Create the file at `/src/components/AuthForm.tsx`.
    - Set up the component to accept the `mode` prop.
    - Build the form layout using Shadcn's `Card`, `Label`, `Input`, and `Button` components.
2.  **Add State Management**:
    - Implement the `useState` hooks for `formData`, `isLoading`, and `error`.
    - Create event handlers (`handleChange`, `handleSubmit`) to manage state updates and form submission.
3.  **Integrate Supabase**:
    - Import the Supabase client.
    - In `handleSubmit`, call `supabase.auth.signInWithPassword` or `supabase.auth.signUp` based on the `mode` prop.
    - Handle the promise resolution: redirect on success, set error state on failure.
4.  **Create Astro Pages**:
    - Create `login.astro` and `register.astro` in `/src/pages/`.
    - Import and render the `AuthForm` component in each file, passing the corresponding `mode` prop (`'login'` or `'register'`).
    - Ensure `client:load` is used to make the React component interactive.
5.  **Implement Redirection**:
    - Use `window.location.href = '/';` for redirection after a successful authentication event. This will trigger Astro's middleware to handle protected routing.
6.  **Style and Finalize**:
    - Add a link to toggle between the login and register pages.
    - Ensure the layout is responsive and centered on the page.
    - Verify all accessibility requirements (labels, focus states) are met.
