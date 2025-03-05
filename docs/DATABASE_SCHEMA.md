# Database Schema

This document outlines the Firestore database schema used in the CS CRM Dashboard application.

## Collections Overview

The application uses the following Firestore collections:

- `users`: User accounts and profiles
- `monitoring`: Real-time user activity status
- `activityLogs`: Historical record of user activities
- `requests`: Holiday and special requests
- `signedDocuments`: Signed HR documents
- `payslips`: Employee payslips
- `holidayRecords`: Holiday records
- `holidayBalances`: Holiday balance tracking
- `contracts`: Employee contracts
- `knowledgeBase`: Knowledge base articles
- `knowledgeBaseCategories`: Categories for knowledge base
- `schedules`: User work schedules
- `settings`: Application settings

## Collection Schemas

### Users Collection

```typescript
interface User {
  id: string;                 // Document ID (same as Auth UID)
  uid: string;                // Firebase Auth UID
  email: string;              // User email
  name: string;               // User display name
  role: 'admin' | 'hr' | 'user'; // User role
  tier: 'tier1' | 'tier2' | 'tier3' | 'compliance'; // User tier
  scheduleType: 'standard' | 'short' | 'nine'; // Schedule type
  capabilities: {             // User capabilities
    canDoCRM: boolean;
    canDoCalls: boolean;
    isIntern: boolean;
    canDoCompliance: boolean;
  };
  status: 'active' | 'inactive'; // Account status
  createdAt: Timestamp;       // Account creation date
  lastLogin?: Timestamp;      // Last login date
  lastActive?: string;        // ISO string of last activity
}
```

### Monitoring Collection

```typescript
interface MonitoringData {
  status: 'checked-in' | 'checked-out' | 'lunch' | 'break'; // Current status
  lastAction: string;         // Last action performed
  lastActionTime: Timestamp;  // Time of last action
  userName: string;           // User's display name
  email: string;              // User's email
  currentTask?: string;       // Current task (optional)
  updatedAt: string;          // ISO string of last update
}
```

### Activity Logs Collection

```typescript
interface ActivityLog {
  userId: string;             // User ID
  status: 'checked-in' | 'checked-out' | 'lunch' | 'break'; // Status change
  timestamp: Timestamp;       // When the activity occurred
  createdAt: string;          // ISO string of creation time
  type?: 'login' | 'logout' | 'status_change'; // Activity type
  details?: string;           // Additional details
}
```

### Requests Collection

```typescript
interface Request {
  id?: string;                // Document ID
  userId: string;             // Requester ID
  agentId: string;            // Agent ID (same as userId)
  type: 'holiday' | 'special'; // Request type
  startDate: Timestamp;       // Start date
  endDate: Timestamp;         // End date
  reason: string;             // Reason for request
  status: 'pending' | 'approved' | 'rejected'; // Request status
  createdAt?: Timestamp;      // Creation date
  updatedAt?: Timestamp;      // Last update date
}
```

### Signed Documents Collection

```typescript
interface SignedDocument {
  id: string;                 // Document ID
  agentId: string;            // Agent ID
  agentName: string;          // Agent name
  documentData: string;       // Document data (base64)
  month: string;              // Month (MM format)
  year: string;               // Year (YYYY format)
  uploadedAt: Timestamp;      // Upload date
  fileName: string;           // Original file name
}
```

### Payslips Collection

```typescript
interface Payslip {
  id: string;                 // Document ID
  agentId: string;            // Agent ID
  agentName: string;          // Agent name
  documentUrl: string;        // Document storage URL
  month: string;              // Month (MM format)
  year: string;               // Year (YYYY format)
  uploadedAt: Timestamp;      // Upload date
}
```

### Holiday Records Collection

```typescript
interface HolidayRecord {
  id: string;                 // Document ID
  agentId: string;            // Agent ID
  agentName: string;          // Agent name
  startDate: Timestamp;       // Start date
  endDate: Timestamp;         // End date
  days: number;               // Number of days
  status: 'pending' | 'approved' | 'rejected'; // Status
}
```

### Holiday Balances Collection

```typescript
interface AgentHolidayBalance {
  id: string;                 // Document ID
  agentId: string;            // Agent ID
  agentName: string;          // Agent name
  totalDays: number;          // Total days allocated
  usedDays: number;           // Days used
  remainingDays: number;      // Days remaining
  year: string;               // Year (YYYY format)
}
```

### Contracts Collection

```typescript
interface Contract {
  id: string;                 // Document ID
  agentId: string;            // Agent ID
  agentName: string;          // Agent name
  contractType: 'CDI' | 'CDD' | 'Internship' | 'Other'; // Contract type
  startDate: Timestamp;       // Start date
  endDate?: Timestamp;        // End date (optional for permanent contracts)
  salary: number;             // Salary amount
  position: string;           // Job position
  department: string;         // Department
  status: 'active' | 'terminated' | 'pending'; // Contract status
  documents: string[];        // Array of document URLs
  createdAt: Timestamp;       // Creation date
  updatedAt: Timestamp;       // Last update date
}
```

### Knowledge Base Collection

```typescript
interface KnowledgeBaseArticle {
  id?: string;                // Document ID
  title: string;              // Article title
  content: string;            // Article content
  category: 'Contrats' | 'Paiements' | 'Compliance' | 'Support'; // Category
  tags: string[];             // Array of tags
  createdAt?: Timestamp;      // Creation date
  updatedAt?: Timestamp;      // Last update date
  authorId: string;           // Author ID
  authorName: string;         // Author name
  type: 'personal' | 'general'; // Article type
  visibility: 'public' | 'private'; // Article visibility
  images?: string[];          // Array of image URLs
  summary?: string;           // Short summary
}
```

### Knowledge Base Categories Collection

```typescript
interface KnowledgeBaseCategory {
  id: string;                 // Document ID
  name: string;               // Category name
  description: string;        // Category description
  icon: string;               // Icon name
  order: number;              // Display order
  createdAt: Timestamp;       // Creation date
}
```

### Schedules Collection

```typescript
interface Schedule {
  id?: string;                // Document ID
  userId: string;             // User ID
  date: Timestamp;            // Schedule date
  shift: string;              // Shift type
  status: string;             // Status
  tasks: {                    // Tasks for the day
    morning: 'CALL' | 'CRM';
    afternoon: 'CALL' | 'CRM';
  };
}
```

### Settings Collection

```typescript
interface Settings {
  id: string;                 // Document ID (e.g., 'app')
  version: string;            // App version
  maintenanceMode: boolean;   // Maintenance mode flag
  features: {                 // Feature flags
    knowledgeBase: boolean;
    hrModule: boolean;
    activityTracking: boolean;
  };
  updatedAt: Timestamp;       // Last update date
}
```

## Relationships

- **Users → Monitoring**: One-to-one relationship by user ID
- **Users → ActivityLogs**: One-to-many relationship by user ID
- **Users → Requests**: One-to-many relationship by user ID
- **Users → SignedDocuments**: One-to-many relationship by agent ID
- **Users → Payslips**: One-to-many relationship by agent ID
- **Users → HolidayRecords**: One-to-many relationship by agent ID
- **Users → HolidayBalances**: One-to-many relationship by agent ID
- **Users → Contracts**: One-to-many relationship by agent ID
- **Users → KnowledgeBase**: One-to-many relationship by author ID
- **Users → Schedules**: One-to-many relationship by user ID
- **KnowledgeBase → KnowledgeBaseCategories**: Many-to-one relationship by category ID

## Indexes

The application uses the following composite indexes:

- `requests`: (userId, createdAt DESC)
- `requests`: (agentId, createdAt DESC)
- `activityLogs`: (userId, timestamp DESC)
- `activityLogs`: (userId, timestamp ASC)
- `knowledgeBase`: (authorId, createdAt DESC)
- `knowledgeBase`: (type, isPrivate, createdAt DESC)
- `knowledgeBase`: (type, createdAt DESC)
- `knowledgeBase`: (type, authorId, createdAt DESC)
- `knowledgeBase`: (isPrivate, authorId, createdAt DESC)
- `knowledgeBase`: (isPrivate, createdAt DESC)
- `contracts`: (agentId, createdAt DESC)
- `tasks`: (assignedTo, status, dueDate ASC)
- `faq`: (category, createdAt DESC)
- `checkins`: (userId, timestamp DESC)
- `privateNotes`: (articleId, authorId, createdAt DESC) 