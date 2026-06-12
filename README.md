# Team Leave & On-Call Manager

A modern, responsive web application for managing team leave requests and on-call rotations. Built with React and Vite, this tool helps teams coordinate absences and track who is on-call each week.

## Features

- **Leave Request Management**: Create, edit, and approve leave requests for team members
- **Calendar View**: Visual representation of leave schedules and on-call assignments
- **On-Call Tracking**: Automatic rotation system that tracks who is on-call each week
- **Team Availability**: Quick overview of team availability and current leave status
- **Conflict Detection**: Alerts when someone is scheduled both for on-call duty and on leave
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Local Storage**: All data is persisted in browser localStorage for offline access
- **Real-time Updates**: Instant UI updates when data changes

## Setup Instructions

### 1. Clone or Navigate to Project Directory

```bash
cd team-calendar
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- React and React DOM for the UI framework
- Vite for fast development and optimized builds
- ESLint for code quality checks

### 3. Verify Installation

```bash
npm run lint
```

This checks the code for any linting issues (optional but recommended).

### How to Run the Application
Start the development server with hot module reloading:
```bash
npm run dev
```

### Production Build

Create an optimized production build:

```bash
npm run build
```

This generates an optimized build in the `dist/` directory that can be deployed to any static hosting service.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

This serves the optimized build and allows you to test it before deployment.

## Key Components

### Avatar
Displays a colored badge with team member initials.

### Modal
Reusable modal dialog for forms and dialogs with Escape key support.

### LeaveForm
Form for creating and editing leave requests with:
- Team member selection
- Start and end date pickers
- Reason textarea
- Status management (for admins)
- Overlap detection

### LeaveList
Table/card-based view of leave requests with:
- Filtering by member and status
- Inline status editing
- Edit and delete actions

### CalendarView
Monthly calendar showing:
- Leave events color-coded by status
- On-call assignments for each day
- Visual conflict indicators

### OnCallView
Week-based on-call schedule with:
- Current and upcoming weeks
- Conflict warnings
- Integration with calendar view

### TeamView
Team member grid displaying:
- Current availability status
- Leave days approved and pending
- Quick leave request buttons

## Assumptions Made

1. **Browser LocalStorage**: The application assumes browser LocalStorage is available and enabled. Data is stored in the browser and persists across sessions but not across different browsers or devices.

2. **No Authentication**: The application does not include user authentication. It assumes all users have equal permissions to create, edit, and delete leave requests. In a production environment, user authentication and role-based permissions should be added.

3. **Single Team**: The current implementation supports one hardcoded team of 4 members (Alice, Bob, Charlie, Diana). Dynamic team member management is not included.

4. **Fixed On-Call Rotation**: The on-call schedule rotates through the team in a fixed weekly pattern anchored to January 1, 2024. No custom rotation rules or preferences are supported.

5. **Client-Side Only**: All logic runs client-side. There is no backend server or database. Data is not synced across devices or shared with other users.

6. **Modern Browser**: The application assumes a modern browser with ES6+ support, localStorage, and React 19 compatibility.

7. **Timezone**: Dates are handled in the browser's local timezone without explicit timezone management.

## Optional Improvements Added / Potential Enhancements

### Currently Implemented:
✅ **Responsive Mobile Design** - Works on phones, tablets, and desktops  
✅ **Conflict Detection** - Alerts when member is on leave during on-call week  
✅ **Multiple View Types** - List, calendar, and grid views for different use cases  
✅ **Form Validation** - Comprehensive validation with helpful error messages  
✅ **Real-time Updates** - Instant UI updates when data changes  
✅ **Keyboard Support** - Escape key closes modals  

### Recommended Future Enhancements:

1. **Data Export**
   - Export leave schedule to CSV
   - Generate PDF reports
   - iCal format for calendar imports

2. **Advanced Filtering & Search**
   - Search by leave reason
   - Filter by date ranges
   - Multi-select filtering

3. **Recurring Patterns**
   - Support for recurring leave (e.g., every Friday)
   - Batch create/delete operations

4. **Backend Integration**
   - Connect to a Node.js/Express API
   - Real database (PostgreSQL, MongoDB)
   - User authentication with JWT or OAuth
   - Role-based permissions

5. **Enhanced UI/UX**
   - Drag-and-drop event editing in calendar
   - Time range selection for half-day leaves
   - Leave reason templates/presets
   - Undo/redo functionality

## Troubleshooting

### Port Already in Use
If port 5173 is already in use:
```bash
npm run dev -- --port 3000
```

### Module Not Found Errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

This project is provided as-is for team management purposes.