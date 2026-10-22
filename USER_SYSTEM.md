# User System Documentation

## Overview
The application uses `data/users.json` to store and manage user information. Users can register, login, and manage their accounts.

## Users.json Structure
```json
{
  "users": {
    "user@email.com": {
      "name": "User Name",
      "email": "user@email.com",
      "password": "hashedPassword",
      "createdAt": "2026-03-22T12:00:00.000Z"
    }
  }
}
```

## API Endpoints

### GET /api/users
Fetches all users from `users.json`
- **Response**: Object with all users keyed by email
- **Example**: `{ "user@example.com": { name, email, password, createdAt } }`

### GET /api/users/:email
Fetches a specific user by email
- **Parameters**: `email` - User's email address
- **Response**: Single user object
- **Status Codes**: 
  - 200: User found
  - 404: User not found

### POST /api/users
Creates a new user in `users.json`
- **Body**: `{ name, email, password, createdAt }`
- **Response**: Created user object
- **Status Codes**:
  - 201: User created successfully
  - 400: Invalid payload
  - 409: User already exists

### PUT /api/users
Updates all users in `users.json`
- **Body**: `{ users: { ...userObjects } }`
- **Response**: Updated users object

### DELETE /api/users/:email
Deletes a user from `users.json`
- **Parameters**: `email` - User's email address
- **Response**: `{ success: true }`
- **Status Codes**:
  - 200: User deleted
  - 404: User not found

## Frontend Functions

### getUserByEmail(email)
Fetches user information by email from the API
- **Returns**: User object or null
- **Usage**: `const user = await getUserByEmail('user@example.com');`

### getAllUsers()
Fetches all users from the API
- **Returns**: Object containing all users
- **Usage**: `const allUsers = await getAllUsers();`

### updateUser(email, updates)
Updates specific user fields
- **Parameters**: 
  - `email`: User's email
  - `updates`: Object with fields to update
- **Returns**: Boolean (success/failure)
- **Usage**: `await updateUser('user@example.com', { name: 'NewName' });`

### registerUser(event)
Handles user registration via form submission
- Validates password strength and matching
- Checks for existing email
- POSTs to backend API
- Falls back to localStorage if backend unavailable

### loginUser(event)
Handles user login via form submission
- Fetches fresh user data from backend
- Validates credentials
- Stores current user in localStorage

## Data Flow

### Registration
1. User fills registration form
2. Frontend validates input (password match, length, etc.)
3. Frontend POSTs user data to `/api/users`
4. Backend saves to `users.json`
5. Frontend updates local `usersData` object
6. localStorage is updated for offline fallback

### Login
1. User fills login form
2. Frontend fetches all users from `/api/users` (ensures latest data)
3. Frontend validates email/password
4. Current user is stored in localStorage
5. User redirected to home page

### Data Persistence
- **Primary**: `data/users.json` on backend
- **Secondary**: `usersData` JavaScript object (loaded at page load)
- **Fallback**: `localStorage` (for offline functionality)

## Security Notes
- **Warning**: This implementation stores passwords in plain text.

## File Locations
- Backend: `data/users.json`
- Frontend handlers: `main.js` (registerUser, loginUser, etc.)
- API endpoints: `server.js`
