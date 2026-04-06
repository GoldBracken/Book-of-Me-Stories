# Book of Me Stories - Data Management

## Data Storage Structure

This application now uses JSON files for initial data loading and localStorage for persistence. Here's how the data is organized:

### File Structure
```
data/
├── users.json      # User account data
└── stories.json    # Story content data
```

### Data Formats

#### users.json
```json
{
  "users": {
    "user@example.com": {
      "name": "John Doe",
      "email": "user@example.com",
      "password": "hashed_password",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### stories.json
```json
{
  "stories": {
    "story-1234567890": {
      "title": "My Story Title",
      "date": "2024-01-01",
      "author": "John Doe",
      "content": "Story content here...",
      "tags": "family, memories",
      "image": "data:image/...",
      "privacy": false,
      "savedAt": "2024-01-01T00:00:00.000Z",
      "userEmail": "user@example.com"
    }
  }
}
```

### Data Management

1. **Initial Load**: JSON files are loaded on application startup
2. **Migration**: Existing localStorage data is automatically migrated to the new structure
3. **Persistence**: All writes go to localStorage for immediate persistence
4. **Fallback**: If JSON files can't be loaded, the app falls back to localStorage-only mode

### API Functions

- `loadInitialData()`: Loads data from JSON files
- `saveUsersData()`: Saves user data to localStorage
- `saveStoriesData()`: Saves story data to localStorage
- `getStory(key)`: Retrieves a story by key
- `saveStory(key, data)`: Saves a story
- `deleteStory(key)`: Deletes a story
- `getAllStories()`: Returns all stories

### Security Note

Passwords are stored in plain text for demo purposes. In a production application, passwords should be properly hashed using bcrypt or similar.

### Future Enhancements

To enable server-side persistence, you would need:
1. File write permissions on the server
2. Proper authentication and authorization
3. Database integration for better performance