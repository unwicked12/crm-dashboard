# Data Model

This document outlines the data model of the CS CRM Dashboard application, providing an overview of the key collections, documents, and their relationships in Firestore.

## Database Structure

The application uses Firebase Firestore as its primary database, which is a NoSQL document database. The data is organized into collections and documents.

### Collections Overview

```
firestore-root
├── users
├── settings
├── activities
├── requests
├── schedules
├── knowledge_base
└── hr
    ├── documents
    ├── payslips
    ├── holiday_records
    ├── holiday_balances
    ├── agents
    └── contracts
```

## Core Collections

### Users Collection

Stores user account information and permissions.

**Document ID**: User's UID from Firebase Authentication

**Fields**:
- `email`: string - User's email address
- `displayName`: string - User's display name
- `photoURL`: string (optional) - URL to user's profile photo
- `userTier`: string - User's tier level ('tier1', 'tier2', 'tier3', 'compliance')
- `capabilities`: object - User's capabilities based on tier
  - `canDoCRM`: boolean - Whether user can access CRM features
  - `canDoCalls`: boolean - Whether user can make calls
  - `isIntern`: boolean - Whether user is an intern
  - `canDoCompliance`: boolean - Whether user can access compliance features
- `createdAt`: timestamp - When the user was created
- `lastLogin`: timestamp - When the user last logged in
- `isActive`: boolean - Whether the user account is active

**Example**:
```json
{
  "email": "john.doe@example.com",
  "displayName": "John Doe",
  "photoURL": "https://example.com/profile.jpg",
  "userTier": "tier2",
  "capabilities": {
    "canDoCRM": true,
    "canDoCalls": true,
    "isIntern": false,
    "canDoCompliance": false
  },
  "createdAt": "2023-01-15T10:30:00Z",
  "lastLogin": "2023-06-20T08:45:00Z",
  "isActive": true
}
```

### Settings Collection

Stores application-wide settings.

**Document ID**: Setting category (e.g., "general", "notifications")

**Fields**:
- Various settings specific to the category

**Example**:
```json
{
  "companyName": "CS CRM Inc.",
  "defaultTheme": "light",
  "maintenanceMode": false,
  "version": "1.2.0"
}
```

### Activities Collection

Tracks user activities within the system.

**Document ID**: Auto-generated

**Fields**:
- `userId`: string - ID of the user who performed the activity
- `action`: string - Type of activity (e.g., "login", "logout", "create", "update")
- `resource`: string - Resource affected (e.g., "user", "request", "document")
- `resourceId`: string - ID of the affected resource
- `details`: object - Additional details about the activity
- `timestamp`: timestamp - When the activity occurred
- `ipAddress`: string - IP address from which the activity was performed

**Example**:
```json
{
  "userId": "user123",
  "action": "create",
  "resource": "request",
  "resourceId": "request456",
  "details": {
    "requestType": "vacation",
    "startDate": "2023-07-10",
    "endDate": "2023-07-15"
  },
  "timestamp": "2023-06-25T14:20:00Z",
  "ipAddress": "192.168.1.1"
}
```

### Requests Collection

Stores user requests for various purposes.

**Document ID**: Auto-generated

**Fields**:
- `userId`: string - ID of the user who made the request
- `type`: string - Type of request (e.g., "vacation", "equipment", "support")
- `status`: string - Status of the request ("pending", "approved", "rejected", "completed")
- `title`: string - Brief title of the request
- `description`: string - Detailed description of the request
- `createdAt`: timestamp - When the request was created
- `updatedAt`: timestamp - When the request was last updated
- `approvedBy`: string (optional) - ID of the user who approved the request
- `rejectedBy`: string (optional) - ID of the user who rejected the request
- `completedAt`: timestamp (optional) - When the request was completed
- `attachments`: array (optional) - List of attachment URLs

**Example**:
```json
{
  "userId": "user123",
  "type": "vacation",
  "status": "approved",
  "title": "Summer Vacation",
  "description": "Taking two weeks off for family vacation",
  "createdAt": "2023-05-10T09:15:00Z",
  "updatedAt": "2023-05-12T11:30:00Z",
  "approvedBy": "manager456",
  "completedAt": null,
  "attachments": []
}
```

### Schedules Collection

Stores agent schedules and assignments.

**Document ID**: Auto-generated or date-based (e.g., "2023-06-25")

**Fields**:
- `userId`: string - ID of the user whose schedule this is
- `date`: string - Date of the schedule (YYYY-MM-DD)
- `shifts`: array - List of shift objects
  - `start`: timestamp - Start time of the shift
  - `end`: timestamp - End time of the shift
  - `type`: string - Type of shift (e.g., "regular", "overtime")
- `tasks`: array - List of task assignments
  - `id`: string - Task ID
  - `title`: string - Task title
  - `description`: string - Task description
  - `priority`: string - Task priority ("low", "medium", "high")
  - `status`: string - Task status ("pending", "in-progress", "completed")
  - `startTime`: timestamp - When the task should start
  - `endTime`: timestamp - When the task should end
- `notes`: string - Additional notes about the schedule

**Example**:
```json
{
  "userId": "agent789",
  "date": "2023-06-25",
  "shifts": [
    {
      "start": "2023-06-25T09:00:00Z",
      "end": "2023-06-25T17:00:00Z",
      "type": "regular"
    }
  ],
  "tasks": [
    {
      "id": "task123",
      "title": "Client Call",
      "description": "Follow up with client about recent inquiry",
      "priority": "high",
      "status": "pending",
      "startTime": "2023-06-25T10:00:00Z",
      "endTime": "2023-06-25T10:30:00Z"
    },
    {
      "id": "task456",
      "title": "Documentation Review",
      "description": "Review compliance documentation for new client",
      "priority": "medium",
      "status": "pending",
      "startTime": "2023-06-25T13:00:00Z",
      "endTime": "2023-06-25T15:00:00Z"
    }
  ],
  "notes": "Team meeting at 9:30 AM"
}
```

### Knowledge Base Collection

Stores knowledge base articles and resources.

**Document ID**: Auto-generated

**Fields**:
- `title`: string - Article title
- `content`: string - Article content (may include HTML)
- `category`: string - Article category
- `tags`: array - List of tags for the article
- `author`: string - ID of the user who created the article
- `createdAt`: timestamp - When the article was created
- `updatedAt`: timestamp - When the article was last updated
- `publishedAt`: timestamp (optional) - When the article was published
- `isPublished`: boolean - Whether the article is published
- `viewCount`: number - Number of times the article has been viewed
- `attachments`: array (optional) - List of attachment URLs

**Example**:
```json
{
  "title": "How to Process Client Requests",
  "content": "<h1>Processing Client Requests</h1><p>This guide explains the standard procedure...</p>",
  "category": "procedures",
  "tags": ["client", "requests", "processing"],
  "author": "user123",
  "createdAt": "2023-03-10T14:20:00Z",
  "updatedAt": "2023-04-15T09:45:00Z",
  "publishedAt": "2023-04-15T10:00:00Z",
  "isPublished": true,
  "viewCount": 42,
  "attachments": ["https://example.com/attachments/flowchart.pdf"]
}
```

## HR Collections

### HR/Documents Collection

Stores HR-related documents.

**Document ID**: Auto-generated

**Fields**:
- `userId`: string - ID of the user the document belongs to
- `title`: string - Document title
- `type`: string - Document type (e.g., "contract", "policy", "form")
- `status`: string - Document status ("draft", "pending", "signed", "expired")
- `url`: string - URL to the document file
- `createdAt`: timestamp - When the document was created
- `updatedAt`: timestamp - When the document was last updated
- `expiresAt`: timestamp (optional) - When the document expires
- `signedAt`: timestamp (optional) - When the document was signed
- `signedBy`: string (optional) - ID of the user who signed the document

**Example**:
```json
{
  "userId": "employee123",
  "title": "Employment Contract",
  "type": "contract",
  "status": "signed",
  "url": "https://example.com/documents/contract123.pdf",
  "createdAt": "2023-01-15T10:30:00Z",
  "updatedAt": "2023-01-20T14:45:00Z",
  "expiresAt": "2024-01-15T00:00:00Z",
  "signedAt": "2023-01-20T14:45:00Z",
  "signedBy": "employee123"
}
```

### HR/Payslips Collection

Stores employee payslips.

**Document ID**: Auto-generated

**Fields**:
- `userId`: string - ID of the user the payslip belongs to
- `period`: string - Pay period (e.g., "2023-06")
- `amount`: number - Gross amount
- `currency`: string - Currency code (e.g., "USD", "EUR")
- `status`: string - Payslip status ("draft", "issued", "paid")
- `url`: string - URL to the payslip file
- `issuedAt`: timestamp - When the payslip was issued
- `paidAt`: timestamp (optional) - When the payment was made

**Example**:
```json
{
  "userId": "employee123",
  "period": "2023-06",
  "amount": 5000.00,
  "currency": "USD",
  "status": "paid",
  "url": "https://example.com/payslips/employee123-2023-06.pdf",
  "issuedAt": "2023-07-01T10:00:00Z",
  "paidAt": "2023-07-05T09:30:00Z"
}
```

### HR/Holiday Records Collection

Stores employee holiday/leave records.

**Document ID**: Auto-generated

**Fields**:
- `userId`: string - ID of the user the holiday record belongs to
- `type`: string - Type of leave (e.g., "vacation", "sick", "personal")
- `startDate`: timestamp - Start date of the leave
- `endDate`: timestamp - End date of the leave
- `status`: string - Status of the leave request ("pending", "approved", "rejected", "completed")
- `requestedAt`: timestamp - When the leave was requested
- `approvedBy`: string (optional) - ID of the user who approved the leave
- `rejectedBy`: string (optional) - ID of the user who rejected the leave
- `notes`: string (optional) - Additional notes about the leave

**Example**:
```json
{
  "userId": "employee123",
  "type": "vacation",
  "startDate": "2023-07-10T00:00:00Z",
  "endDate": "2023-07-15T23:59:59Z",
  "status": "approved",
  "requestedAt": "2023-06-15T11:20:00Z",
  "approvedBy": "manager456",
  "notes": "Annual family vacation"
}
```

### HR/Holiday Balances Collection

Stores employee holiday/leave balances.

**Document ID**: User ID

**Fields**:
- `year`: number - Year for which the balance applies
- `vacationTotal`: number - Total vacation days allocated
- `vacationUsed`: number - Vacation days used
- `vacationRemaining`: number - Remaining vacation days
- `sickTotal`: number - Total sick days allocated
- `sickUsed`: number - Sick days used
- `sickRemaining`: number - Remaining sick days
- `personalTotal`: number - Total personal days allocated
- `personalUsed`: number - Personal days used
- `personalRemaining`: number - Remaining personal days
- `updatedAt`: timestamp - When the balance was last updated

**Example**:
```json
{
  "year": 2023,
  "vacationTotal": 20,
  "vacationUsed": 5,
  "vacationRemaining": 15,
  "sickTotal": 10,
  "sickUsed": 2,
  "sickRemaining": 8,
  "personalTotal": 5,
  "personalUsed": 1,
  "personalRemaining": 4,
  "updatedAt": "2023-06-20T15:30:00Z"
}
```

### HR/Agents Collection

Stores detailed information about agents.

**Document ID**: User ID

**Fields**:
- `employeeId`: string - Employee ID
- `firstName`: string - First name
- `lastName`: string - Last name
- `email`: string - Email address
- `phone`: string - Phone number
- `address`: object - Address information
  - `street`: string - Street address
  - `city`: string - City
  - `state`: string - State/Province
  - `postalCode`: string - Postal/ZIP code
  - `country`: string - Country
- `department`: string - Department
- `position`: string - Job position
- `hireDate`: timestamp - Date of hire
- `terminationDate`: timestamp (optional) - Date of termination
- `isActive`: boolean - Whether the agent is active
- `manager`: string (optional) - ID of the agent's manager
- `emergencyContact`: object - Emergency contact information
  - `name`: string - Contact name
  - `relationship`: string - Relationship to agent
  - `phone`: string - Contact phone number

**Example**:
```json
{
  "employeeId": "EMP123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-123-4567",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postalCode": "12345",
    "country": "USA"
  },
  "department": "Sales",
  "position": "Senior Sales Agent",
  "hireDate": "2020-03-15T00:00:00Z",
  "isActive": true,
  "manager": "manager456",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1-555-987-6543"
  }
}
```

### HR/Contracts Collection

Stores detailed information about employee contracts.

**Document ID**: Auto-generated

**Fields**:
- `userId`: string - ID of the user the contract belongs to
- `type`: string - Contract type (e.g., "full-time", "part-time", "contractor")
- `startDate`: timestamp - Start date of the contract
- `endDate`: timestamp (optional) - End date of the contract (for fixed-term contracts)
- `salary`: number - Salary amount
- `currency`: string - Currency code (e.g., "USD", "EUR")
- `paymentFrequency`: string - Payment frequency (e.g., "monthly", "bi-weekly")
- `benefits`: array - List of benefits included in the contract
- `status`: string - Contract status ("draft", "active", "expired", "terminated")
- `documentUrl`: string - URL to the contract document
- `signedAt`: timestamp (optional) - When the contract was signed
- `terminatedAt`: timestamp (optional) - When the contract was terminated
- `terminationReason`: string (optional) - Reason for termination

**Example**:
```json
{
  "userId": "employee123",
  "type": "full-time",
  "startDate": "2020-03-15T00:00:00Z",
  "salary": 60000,
  "currency": "USD",
  "paymentFrequency": "monthly",
  "benefits": ["health", "dental", "401k", "paid-vacation"],
  "status": "active",
  "documentUrl": "https://example.com/contracts/contract123.pdf",
  "signedAt": "2020-03-10T14:30:00Z"
}
```

## Data Relationships

### One-to-One Relationships

- User → Holiday Balance: Each user has one holiday balance record per year
- User → Agent: Each user has one agent record with detailed information

### One-to-Many Relationships

- User → Documents: One user can have many HR documents
- User → Payslips: One user can have many payslips
- User → Holiday Records: One user can have many holiday records
- User → Schedules: One user can have many schedule entries
- User → Requests: One user can make many requests
- User → Activities: One user can have many activity records

### Many-to-Many Relationships

- Users ↔ Knowledge Base Articles: Many users can author many articles

## Data Validation Rules

1. **User Tier Validation**: User tier must be one of: 'tier1', 'tier2', 'tier3', 'compliance'
2. **Status Validation**: Status fields must contain valid values (e.g., "pending", "approved", "rejected")
3. **Date Validation**: End dates must be after start dates
4. **Required Fields**: Critical fields must not be null or empty
5. **Numeric Validation**: Numeric fields must be within valid ranges

## Data Security Rules

1. **User Data**: Users can only read and write their own data
2. **HR Data**: Only HR personnel can read and write HR data
3. **Admin Data**: Only administrators can read and write administrative data
4. **Public Data**: Knowledge base articles marked as published are readable by all users

## Data Migration Strategies

1. **Version Tracking**: Include version fields in documents to track schema changes
2. **Incremental Updates**: Update documents incrementally as they are accessed
3. **Batch Processing**: Use Cloud Functions to perform batch updates for major schema changes
4. **Backward Compatibility**: Maintain backward compatibility for critical fields

## Data Backup and Recovery

1. **Regular Exports**: Export Firestore data regularly to Cloud Storage
2. **Point-in-Time Recovery**: Use Firestore's point-in-time recovery feature
3. **Disaster Recovery Plan**: Maintain a disaster recovery plan for data loss scenarios 