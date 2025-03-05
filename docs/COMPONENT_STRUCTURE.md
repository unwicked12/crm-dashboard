# Component Structure

This document outlines the component structure of the CS CRM Dashboard application, providing an overview of the key components and their relationships.

## Component Hierarchy

The application follows a hierarchical component structure, with components organized by feature and functionality.

```
App
├── AuthProvider
│   └── ThemeProvider
│       └── Router
│           ├── Login
│           └── Layout
│               ├── Sidebar
│               ├── Header
│               └── Routes
│                   ├── Dashboard
│                   ├── ActivityMonitor
│                   ├── AgentScheduleView
│                   ├── KnowledgeBase
│                   ├── HR Routes
│                   │   ├── HRDashboard
│                   │   └── Admin Routes
│                   │       ├── AdminDashboard
│                   │       ├── RequestManagement
│                   │       ├── UserManagement
│                   │       └── UserTierManagement
│                   └── Admin Routes
│                       ├── AdminDashboard
│                       ├── RequestManagement
│                       ├── UserManagement
│                       └── UserTierManagement
```

## Core Components

### App Component

The root component that initializes the application and sets up the providers.

**Key Responsibilities:**
- Initialize the application
- Set up providers (Auth, Theme)
- Configure routing

### Authentication Components

#### AuthProvider

Provides authentication context to the application.

**Key Responsibilities:**
- Manage user authentication state
- Handle login/logout operations
- Provide user information to child components

#### Login

Handles user authentication.

**Key Responsibilities:**
- Display login form
- Validate user credentials
- Handle authentication errors

### Layout Components

#### Layout

The main layout component that wraps the application content.

**Key Responsibilities:**
- Provide consistent layout structure
- Render header and sidebar
- Display main content area

#### Sidebar

Navigation sidebar for the application.

**Key Responsibilities:**
- Display navigation links
- Show/hide links based on user role
- Handle navigation events

#### Header

Application header with user information and actions.

**Key Responsibilities:**
- Display user information
- Provide quick actions (notifications, profile)
- Handle logout

### Dashboard Components

#### Dashboard

Main dashboard for regular users.

**Key Responsibilities:**
- Display key metrics and statistics
- Provide quick access to common functions
- Show recent activities

#### ActivityMonitor

Monitors and displays user activities.

**Key Responsibilities:**
- Display real-time user status
- Track check-in/check-out times
- Show activity history

#### AgentScheduleView

Displays agent schedules.

**Key Responsibilities:**
- Show daily/weekly schedules
- Display task assignments
- Handle schedule updates

### HR Components

#### HRDashboard
The main dashboard for HR users. Contains tabs for managing signed documents, payslips, contracts, and leave requests. All HR functionality is consolidated in this component.

### Admin Components

#### AdminDashboard

Dashboard for admin users.

**Key Responsibilities:**
- Display system-wide metrics
- Provide access to admin functions
- Monitor system health

#### RequestManagement

Manages user requests.

**Key Responsibilities:**
- Display all requests
- Approve/reject requests
- Track request history

#### UserManagement

Manages user accounts.

**Key Responsibilities:**
- Display user list
- Create/edit/delete users
- Manage user roles and permissions

#### UserTierManagement

Manages user tiers and capabilities.

**Key Responsibilities:**
- Define user tiers
- Configure tier capabilities
- Assign tiers to users

### Knowledge Base Components

#### KnowledgeBase

Knowledge base for storing and retrieving information.

**Key Responsibilities:**
- Display knowledge base articles
- Search and filter articles
- Create/edit/delete articles

## Component Relationships

### Parent-Child Relationships

- **App** → **AuthProvider** → **ThemeProvider** → **Router**
- **Router** → **Login** | **Layout**
- **Layout** → **Sidebar** + **Header** + **Routes**
- **Routes** → Various page components based on route

### Context Relationships

- **AuthContext**: Provided by AuthProvider, consumed by most components
- **ThemeContext**: Provided by ThemeProvider, consumed by UI components

### Component Communication

1. **Props**: Direct parent-to-child communication
2. **Context**: Shared state across component tree
3. **Service Calls**: Components interact with Firebase through service modules

## Component Patterns

### Presentational Components

Simple components focused on rendering UI based on props.

**Examples:**
- UI elements (buttons, cards, etc.)
- Display components (tables, lists, etc.)

### Container Components

Components that manage state and data fetching.

**Examples:**
- Dashboard components
- Management components (UserManagement, etc.)

### Higher-Order Components (HOCs)

Components that wrap other components to add functionality.

**Examples:**
- Protected routes (AdminRoute, HRRoute)
- Authentication wrappers

### Hooks-Based Components

Components that use React hooks for state and effects.

**Examples:**
- Most functional components in the application

## Component Lifecycle

### Mounting

1. Component is rendered for the first time
2. `useEffect` hooks with empty dependency arrays run
3. Data fetching operations are initiated

### Updating

1. Component re-renders due to prop or state changes
2. `useEffect` hooks with dependencies run when those dependencies change
3. UI is updated to reflect new data

### Unmounting

1. Component is removed from the DOM
2. Cleanup functions from `useEffect` hooks run
3. Resources are released

## Component Documentation

### Component Props

Each component should document its props:

```typescript
interface ComponentProps {
  /** Description of prop1 */
  prop1: string;
  
  /** Description of prop2 */
  prop2: number;
  
  /** Description of prop3 */
  prop3?: boolean;
}
```

### Component Examples

Example usage of components:

```tsx
// Example of UserManagement component
<UserManagement 
  initialFilter="active"
  onUserCreated={(user) => console.log('User created:', user)}
/>
```

## Component Best Practices

1. **Single Responsibility**: Each component should have a single responsibility
2. **Prop Validation**: Use TypeScript interfaces for prop validation
3. **Error Handling**: Components should handle errors gracefully
4. **Loading States**: Components should display loading states during data fetching
5. **Accessibility**: Components should be accessible (keyboard navigation, ARIA attributes)
6. **Responsive Design**: Components should adapt to different screen sizes
7. **Performance**: Components should be optimized for performance (memoization, etc.) 