# Unified User Profile Page - Implementation Guide

## Overview
The **UnifiedUserProfilePage** is a comprehensive user profile interface that displays complete user information, assigned assets, activity history, security settings, and quick actions in a single, well-organized view.

## Features

### 1. **Profile Header**
- User avatar with initials
- User name and designation
- Primary branch/location
- Last login timestamp
- Quick action buttons (Edit Profile, View Users, Download Profile)

### 2. **Statistics Dashboard**
Four key metrics cards displaying:
- **Assigned Branches**: Number of branches assigned to the user
- **Assigned Assets**: Count of assets assigned
- **Pending Requests**: Outstanding requests
- **Alerts**: System alerts (shows 1 if user is blocked, 0 otherwise)

### 3. **Personal Information Section**
Displays user details in a grid layout:
- Email address
- Phone number (formatted with +91 prefix)
- Employee ID (seqId from database)
- Department
- Role
- Account status badge (Active/Inactive)
- Gender
- Date of birth

### 4. **Assigned Assets Table**
- Interactive table showing all assets assigned to the user
- Columns: Asset Name, Type, Status, Action (View button)
- Status badges with color coding:
  - Green: Assigned
  - Yellow: Repair Pending
  - Red: Inactive
  - Blue: Active

### 5. **Recent Activity**
- Bulleted list of recent user actions
- Includes profile updates, requests, approvals, and login events

### 6. **Quick Actions Sidebar**
- Manage Users button
- View Reports button
- System Settings button
- Security Settings button

### 7. **Security Section**
- Enable 2FA button
- Logout All Devices button

### 8. **Login Sessions**
- Display of active login sessions
- Shows device type, location, and activity status
- Visual indicator for active sessions

## Routes

### 1. **View Own Profile**
```
/profile
```
- Shows the authenticated user's profile
- Displays "Edit Profile" button
- User can edit their own profile from this page

### 2. **View Other User's Profile**
```
/user-profile/:id
```
- Shows a specific user's profile (requires `users:access` permission)
- Does not display "Edit Profile" button
- Useful for administrators viewing team member profiles

### 3. **Legacy User Detail Route**
```
/user-detail/:id
```
- Existing route for backward compatibility
- Uses the older UserDetails component

## Component Structure

### Props
- None (uses React Router `useParams` and `AuthContext`)

### State Management
- `user`: Current user profile data
- `assignedAssets`: Array of assigned assets
- `loginSessions`: Array of active/recent login sessions
- `recentActivity`: Array of activity descriptions
- `loading`: Loading state during data fetch
- `error`: Error message if fetch fails

### Dependencies
- `AuthContext`: For accessing authenticated user data
- `fetchUserById`: API function to fetch user details
- `SetPageTitle`: For setting page title
- `PageLoader`: Loading state component
- React Router: For navigation and route parameters

## Styling

### Responsive Design
- Mobile-first approach using Tailwind CSS
- Grid layouts adapt from 1 column (mobile) to 3 columns (desktop)
- Touch-friendly button sizing
- Optimized for screens from 320px to 1920px+

### Color Scheme
- Primary: Indigo (`#667eea`)
- Secondary: Purple (`#764ba2`)
- Success: Green (`#10b981`)
- Warning: Yellow (`#f59e0b`)
- Danger: Red (`#ef4444`)
- Neutral: Gray palette

### Dark Mode Support
Currently designed for light mode. Dark mode support can be added by implementing Tailwind's dark: prefix.

## API Integration Points

### Current (Mocked)
```javascript
- Assigned Assets: Hardcoded sample data
- Login Sessions: Hardcoded sample data
- Recent Activity: Hardcoded sample data
```

### To Implement
1. **Assigned Assets Endpoint**
   ```
   GET /api/users/:id/assets
   ```

2. **Login Sessions Endpoint**
   ```
   GET /api/users/:id/login-sessions
   ```

3. **Recent Activity Endpoint**
   ```
   GET /api/users/:id/activity
   ```

4. **Update Last Login**
   ```
   PATCH /api/users/:id/lastLogin
   ```

## Permissions
- **View own profile**: Any authenticated user
- **View other user's profile**: Requires `users:access` permission
- **Edit profile**: Own profile only via Edit button

## Data Flow

```
UnifiedUserProfilePage
├── Fetch user via fetchUserById()
├── Parse auth context for authenticated user
├── Determine if viewing own or other profile
├── Load and transform user data
├── Fetch assigned assets (currently mocked)
├── Fetch login sessions (currently mocked)
├── Fetch recent activity (currently mocked)
└── Render complete profile UI
```

## Usage Examples

### For Users
1. Click profile icon in navigation → "View My Profile"
2. View personal information and assigned assets
3. Click "Edit Profile" to update information
4. Check login sessions and recent activity

### For Administrators
1. Navigate to Users list → Click on user row or "View Profile" button
2. View comprehensive user profile
3. See assigned assets and permissions
4. Track user activity and login history
5. No edit capability from this view (navigate to Edit User page)

## Future Enhancements
1. [ ] Real API integration for dynamic data
2. [ ] Print to PDF functionality
3. [ ] User activity chart/timeline
4. [ ] Permission matrix visualization
5. [ ] Asset lifecycle timeline
6. [ ] Audit log with filtering
7. [ ] Bulk actions for administrators
8. [ ] Dark mode support
9. [ ] Export user data in multiple formats
10. [ ] Real-time activity updates via WebSocket

## Troubleshooting

### User Not Found
- Ensure the user ID is valid
- Check database connection
- Verify user permissions

### Assets Not Loading
- Check asset API endpoint
- Verify user-asset associations in database
- Review API error logs

### Profile Not Updating
- Verify authentication token
- Check browser console for errors
- Review API response format

## Performance Considerations
- Component uses lazy loading with Suspense
- Data fetching optimized with useEffect dependency array
- CSS uses minimal selectors for better performance
- Image optimization: Avatar uses initials instead of image file

## Accessibility
- Semantic HTML structure
- Proper heading hierarchy (h1, h2, h4)
- Color contrast meets WCAG AA standards
- Keyboard navigation support
- Screen reader friendly labels

## Testing Checklist
- [ ] Load own profile (/profile)
- [ ] Load other user's profile (/user-profile/:id)
- [ ] Edit Profile button visibility
- [ ] All stats cards display correct data
- [ ] Asset table shows assigned assets
- [ ] Status badges display with correct colors
- [ ] Login sessions display
- [ ] Recent activity shows correctly
- [ ] Mobile responsive layout
- [ ] Error handling when user not found
- [ ] Loading state displays correctly
