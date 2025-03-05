# API Documentation

This document outlines the API structure of the CS CRM Dashboard application, providing details on available endpoints, request/response formats, and authentication requirements.

## API Overview

The CS CRM Dashboard uses two primary types of APIs:

1. **Firebase Client SDKs**: Direct client-side interaction with Firebase services
2. **Cloud Functions**: Custom server-side functionality exposed as HTTP endpoints

## Authentication

All API requests require authentication using Firebase Authentication.

### Authentication Headers

For Cloud Functions HTTP endpoints, include the following header:

```
Authorization: Bearer <firebase-id-token>
```

The Firebase ID token can be obtained using the Firebase Authentication SDK:

```javascript
// Example of obtaining the token in a React component
import { getAuth } from 'firebase/auth';

const fetchWithAuth = async (url, options = {}) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
```

## Firebase Client SDK APIs

### Authentication API

#### Sign In

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};
```

#### Sign Out

```javascript
import { getAuth, signOut } from 'firebase/auth';

const auth = getAuth();
const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
```

### Firestore API

#### Fetch User Data

```javascript
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore();
const fetchUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
```

#### Update User Data

```javascript
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const db = getFirestore();
const updateUserData = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};
```

#### Fetch Collection Data

```javascript
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const db = getFirestore();
const fetchCollectionData = async (collectionName, whereClause = null) => {
  try {
    let q;
    if (whereClause) {
      q = query(
        collection(db, collectionName),
        where(whereClause.field, whereClause.operator, whereClause.value)
      );
    } else {
      q = collection(db, collectionName);
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching ${collectionName} data:`, error);
    throw error;
  }
};
```

### Storage API

#### Upload File

```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();
const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
```

#### Delete File

```javascript
import { getStorage, ref, deleteObject } from 'firebase/storage';

const storage = getStorage();
const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
```

## Cloud Functions APIs

### User Management API

#### Create User

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/createUser`

**Method**: POST

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "displayName": "John Doe",
  "userTier": "tier1"
}
```

**Response**:
```json
{
  "success": true,
  "userId": "user123",
  "message": "User created successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Email already in use",
  "code": "auth/email-already-in-use"
}
```

#### Update User Tier

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/updateUserTier`

**Method**: POST

**Request Body**:
```json
{
  "userId": "user123",
  "userTier": "tier2"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User tier updated successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "User not found",
  "code": "not-found"
}
```

### HR API

#### Generate Payslip

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/generatePayslip`

**Method**: POST

**Request Body**:
```json
{
  "userId": "user123",
  "period": "2023-06",
  "amount": 5000,
  "currency": "USD"
}
```

**Response**:
```json
{
  "success": true,
  "payslipId": "payslip123",
  "url": "https://example.com/payslips/payslip123.pdf"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid period format",
  "code": "invalid-format"
}
```

#### Request Leave

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/requestLeave`

**Method**: POST

**Request Body**:
```json
{
  "userId": "user123",
  "type": "vacation",
  "startDate": "2023-07-10",
  "endDate": "2023-07-15",
  "notes": "Annual family vacation"
}
```

**Response**:
```json
{
  "success": true,
  "requestId": "leave123",
  "message": "Leave request submitted successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Insufficient leave balance",
  "code": "insufficient-balance"
}
```

### Knowledge Base API

#### Create Article

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/createArticle`

**Method**: POST

**Request Body**:
```json
{
  "title": "How to Process Client Requests",
  "content": "<h1>Processing Client Requests</h1><p>This guide explains the standard procedure...</p>",
  "category": "procedures",
  "tags": ["client", "requests", "processing"],
  "isPublished": true
}
```

**Response**:
```json
{
  "success": true,
  "articleId": "article123",
  "message": "Article created successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Title is required",
  "code": "missing-field"
}
```

#### Search Articles

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/searchArticles`

**Method**: GET

**Query Parameters**:
- `query`: Search query string
- `category`: (Optional) Filter by category
- `tags`: (Optional) Filter by tags (comma-separated)
- `limit`: (Optional) Maximum number of results (default: 10)

**Response**:
```json
{
  "success": true,
  "articles": [
    {
      "id": "article123",
      "title": "How to Process Client Requests",
      "category": "procedures",
      "tags": ["client", "requests", "processing"],
      "createdAt": "2023-03-10T14:20:00Z",
      "updatedAt": "2023-04-15T09:45:00Z",
      "author": "user123",
      "excerpt": "This guide explains the standard procedure..."
    },
    {
      "id": "article456",
      "title": "Client Request Form Guide",
      "category": "forms",
      "tags": ["client", "forms", "requests"],
      "createdAt": "2023-02-05T11:30:00Z",
      "updatedAt": "2023-02-05T11:30:00Z",
      "author": "user456",
      "excerpt": "This guide explains how to fill out the client request form..."
    }
  ],
  "total": 2
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid query parameter",
  "code": "invalid-parameter"
}
```

### Request Management API

#### Submit Request

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/submitRequest`

**Method**: POST

**Request Body**:
```json
{
  "userId": "user123",
  "type": "equipment",
  "title": "New Laptop Request",
  "description": "Requesting a new laptop for development work",
  "attachments": []
}
```

**Response**:
```json
{
  "success": true,
  "requestId": "request123",
  "message": "Request submitted successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Description is required",
  "code": "missing-field"
}
```

#### Approve Request

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/approveRequest`

**Method**: POST

**Request Body**:
```json
{
  "requestId": "request123",
  "approverId": "manager456",
  "notes": "Approved as requested"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Request approved successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Request not found",
  "code": "not-found"
}
```

### Schedule Management API

#### Create Schedule

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/createSchedule`

**Method**: POST

**Request Body**:
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
      "title": "Client Call",
      "description": "Follow up with client about recent inquiry",
      "priority": "high",
      "status": "pending",
      "startTime": "2023-06-25T10:00:00Z",
      "endTime": "2023-06-25T10:30:00Z"
    }
  ],
  "notes": "Team meeting at 9:30 AM"
}
```

**Response**:
```json
{
  "success": true,
  "scheduleId": "schedule123",
  "message": "Schedule created successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid shift times",
  "code": "invalid-times"
}
```

#### Get Agent Schedules

**Endpoint**: `https://us-central1-cs-crm.cloudfunctions.net/getAgentSchedules`

**Method**: GET

**Query Parameters**:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `userId`: (Optional) Filter by user ID

**Response**:
```json
{
  "success": true,
  "schedules": [
    {
      "id": "schedule123",
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
        }
      ],
      "notes": "Team meeting at 9:30 AM"
    }
  ],
  "total": 1
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid date format",
  "code": "invalid-format"
}
```

## Error Handling

### Error Codes

| Code | Description |
|------|-------------|
| `auth/email-already-in-use` | The email address is already in use by another account |
| `auth/invalid-email` | The email address is not valid |
| `auth/weak-password` | The password is too weak |
| `auth/user-not-found` | There is no user record corresponding to this identifier |
| `not-found` | The requested resource was not found |
| `permission-denied` | The user does not have permission to access the requested resource |
| `invalid-format` | The request contains data in an invalid format |
| `missing-field` | A required field is missing from the request |
| `invalid-parameter` | A request parameter is invalid |
| `insufficient-balance` | The user has insufficient balance for the requested operation |
| `invalid-times` | The provided time values are invalid |

### Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "error-code",
  "details": {
    // Optional additional error details
  }
}
```

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse:

- **Anonymous requests**: 10 requests per minute
- **Authenticated requests**: 60 requests per minute
- **Admin requests**: 120 requests per minute

When rate limits are exceeded, the API returns a 429 Too Many Requests response with a Retry-After header indicating when to retry.

## Versioning

The API uses URL versioning:

- Current version: v1
- Example URL: `https://us-central1-cs-crm.cloudfunctions.net/v1/createUser`

## Webhooks

The application supports webhooks for certain events:

### Available Webhook Events

- `user.created`: Triggered when a new user is created
- `user.updated`: Triggered when a user is updated
- `request.submitted`: Triggered when a new request is submitted
- `request.approved`: Triggered when a request is approved
- `request.rejected`: Triggered when a request is rejected

### Webhook Payload Format

```json
{
  "event": "user.created",
  "timestamp": "2023-06-25T14:20:00Z",
  "data": {
    // Event-specific data
  }
}
```

### Webhook Configuration

Webhooks can be configured in the application settings by providing:

- Webhook URL
- Secret key (for payload verification)
- Events to subscribe to

## API Best Practices

1. **Authentication**: Always authenticate requests using Firebase Authentication
2. **Error Handling**: Implement proper error handling for all API calls
3. **Validation**: Validate all input data before sending requests
4. **Retry Logic**: Implement exponential backoff for retrying failed requests
5. **Caching**: Cache responses when appropriate to reduce API calls
6. **Batching**: Use batch operations when possible to reduce the number of requests
7. **Pagination**: Use pagination for large result sets
8. **Logging**: Log API errors for debugging and monitoring

## API Testing

### Test Endpoints

For testing purposes, use the following endpoints:

- **Production**: `https://us-central1-cs-crm.cloudfunctions.net/`
- **Staging**: `https://us-central1-cs-crm-staging.cloudfunctions.net/`
- **Development**: `http://localhost:5001/cs-crm-dev/us-central1/`

### Testing Tools

- **Postman**: For manual API testing
- **Jest**: For automated API testing
- **Firebase Emulator**: For local development and testing

## API Changelog

### v1.0.0 (2023-06-01)

- Initial API release

### v1.1.0 (2023-07-15)

- Added Knowledge Base API endpoints
- Improved error handling
- Added rate limiting

### v1.2.0 (2023-08-30)

- Added Schedule Management API endpoints
- Enhanced webhook functionality
- Improved documentation 