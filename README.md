# CRM Dashboard

A comprehensive CRM Dashboard application for managing agent activities, holiday requests, and administrative tasks.

## Features

### Agent Dashboard
- Real-time Activity Monitoring (Check-in, Check-out, Breaks, Lunch)
- Holiday Request Management
- Special Request System
- Daily and Monthly Activity Reports
- Authentication System with Role-based Access

### Admin Dashboard
- Request Management (Holiday and Special requests)
- Team Calendar Overview
- Activity Monitoring for all agents
- Request Approval/Rejection System

## Tech Stack

### Frontend
- React 18 with TypeScript
- Material-UI (MUI) for modern UI components
- React Router v6 for navigation
- Axios for API requests
- Date-fns for date manipulation
- React Context for state management

### Authentication & Security
- Role-based access control (RBAC)
- Protected routes for admin access
- Secure authentication flow

## Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── RequestManagement.tsx
│   │   └── TeamCalendar.tsx
│   ├── dashboard/
│   │   ├── ActivityMonitor.tsx
│   │   ├── HolidayRequest.tsx
│   │   └── SpecialRequest.tsx
│   ├── layout/
│   │   ├── Layout.tsx
│   │   └── Sidebar.tsx
│   └── routes/
│       ├── AdminRoute.tsx
│       └── ProtectedRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   ├── api.ts
│   └── firebase.ts
└── pages/
    └── Login.tsx
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/crm-dashboard.git
   cd crm-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   REACT_APP_API_URL=your_api_url
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Features in Detail

### Activity Monitoring
- Real-time tracking of agent activities
- Support for various activity types (calls, breaks, lunch)
- Automatic time tracking and reporting

### Holiday Request System
- Easy-to-use holiday request form
- Real-time status updates
- Integration with admin approval system
- Calendar view for planned holidays

### Admin Controls
- Comprehensive request management
- Bulk approval/rejection capabilities
- Team calendar overview
- Activity statistics and reporting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
