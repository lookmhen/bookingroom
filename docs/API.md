# API Documentation

## Overview

This document describes the API endpoints provided by the Meeting Room Booking System.

All endpoints require authentication via NextAuth.js session cookies.

---

## Authentication

### Sign In
```http
GET /api/auth/signin
```

Redirects to Microsoft Azure AD login page.

**Response**: Redirect to Azure AD OAuth flow

---

### Sign Out
```http
GET /api/auth/signout
```

Terminates user session and redirects to home page.

**Response**: Redirect to `/`

---

## Rooms

### List All Rooms

```http
GET /api/rooms
```

Retrieves all available meeting rooms with their details.

**Response**
```json
[
  {
    "id": "room-id-123",
    "name": "Conference Room A",
    "email": "room-a@company.com",
    "capacity": 10,
    "building": "Main Building",
    "floor": 2
  }
]
```

**Status Codes**
- `200` - Success
- `401` - Unauthorized (not signed in)
- `500` - Server error

---

## Bookings

### Create Booking

```http
POST /api/bookings
```

Creates a new meeting room booking.

**Request Body**
```json
{
  "subject": "Team Sync",
  "description": "Weekly team synchronization meeting",
  "attendees": ["user1@company.com", "user2@company.com"],
  "start": "2024-01-15T10:00:00.000Z",
  "end": "2024-01-15T11:00:00.000Z",
  "roomId": "room-id-123",
  "roomEmail": "room-a@company.com",
  "isOnlineMeeting": true
}
```

**Parameters**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subject | string | Yes | Meeting title |
| description | string | No | Meeting description/agenda |
| attendees | string[] | No | Array of attendee email addresses |
| start | string (ISO 8601) | Yes | Start time in UTC |
| end | string (ISO 8601) | Yes | End time in UTC |
| roomId | string | Yes | Room identifier |
| roomEmail | string | Yes | Room email address |
| isOnlineMeeting | boolean | No | Create Teams meeting (default: false) |

**Response**
```json
{
  "id": "event-id-456",
  "subject": "Team Sync",
  "start": {
    "dateTime": "2024-01-15T10:00:00.000Z",
    "timeZone": "UTC"
  },
  "end": {
    "dateTime": "2024-01-15T11:00:00.000Z",
    "timeZone": "UTC"
  },
  "location": {
    "displayName": "room-a@company.com"
  },
  "onlineMeeting": {
    "joinUrl": "https://teams.microsoft.com/l/meetup/..."
  }
}
```

**Status Codes**
- `200` - Booking created successfully
- `401` - Unauthorized
- `500` - Server error

---

### Update Booking

```http
PATCH /api/bookings/[id]
```

Updates an existing booking.

**URL Parameters**
- `id` - Event ID from Microsoft Graph

**Request Body**
```json
{
  "subject": "Updated Team Sync",
  "description": "Updated description",
  "attendees": ["user1@company.com", "user3@company.com"],
  "start": "2024-01-15T11:00:00.000Z",
  "end": "2024-01-15T12:00:00.000Z",
  "isOnlineMeeting": false
}
```

**Parameters**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subject | string | No | Updated meeting title |
| description | string | No | Updated description |
| attendees | string[] | No | Updated attendee list |
| start | string (ISO 8601) | No | Updated start time |
| end | string (ISO 8601) | No | Updated end time |
| isOnlineMeeting | boolean | No | Add/remove Teams meeting |

**Response**
```json
{
  "id": "event-id-456",
  "subject": "Updated Team Sync",
  ...
}
```

**Status Codes**
- `200` - Booking updated successfully
- `400` - Invalid request (missing booking ID)
- `401` - Unauthorized
- `500` - Server error

---

### Delete Booking

```http
DELETE /api/bookings/[id]
```

Cancels and deletes a booking.

**URL Parameters**
- `id` - Event ID from Microsoft Graph

**Response**
- Empty body with status `204`

**Status Codes**
- `204` - Booking cancelled successfully
- `400` - Invalid request (missing booking ID)
- `401` - Unauthorized
- `500` - Server error

---

### Get My Bookings

```http
GET /api/my-bookings
```

Retrieves all upcoming bookings for the authenticated user.

**Response**
```json
[
  {
    "id": "event-id-456",
    "subject": "Team Sync",
    "start": {
      "dateTime": "2024-01-15T10:00:00.000Z",
      "timeZone": "UTC"
    },
    "end": {
      "dateTime": "2024-01-15T11:00:00.000Z",
      "timeZone": "UTC"
    },
    "location": {
      "displayName": "room-a@company.com"
    },
    "attendees": [
      {
        "emailAddress": {
          "address": "user1@company.com",
          "name": "User One"
        }
      }
    ],
    "preview": "Meeting description here",
    "onlineMeeting": {
      "joinUrl": "https://teams.microsoft.com/..."
    }
  }
]
```

**Status Codes**
- `200` - Success
- `401` - Unauthorized or token expired (returns `TOKEN_EXPIRED` error)
- `500` - Server error

**Token Expiration Response**
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Your session has expired. Please sign in again."
}
```

---

## Availability

### Check Room Availability

```http
POST /api/availability
```

Checks room availability and detects conflicts for a given time range.

**Request Body**
```json
{
  "roomEmails": ["room-a@company.com"],
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "excludeEventId": "event-id-to-exclude",
  "checkConflicts": true
}
```

**Parameters**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| roomEmails | string[] | Yes | Array of room email addresses |
| startTime | string (ISO 8601) | Yes | Start time to check |
| endTime | string (ISO 8601) | Yes | End time to check |
| excludeEventId | string | No | Event ID to exclude (for edit scenarios) |
| checkConflicts | boolean | No | Return detailed conflict information |

**Response (without checkConflicts)**
```json
[
  {
    "scheduleId": "room-a@company.com",
    "availabilityView": "222000222",
    "scheduleItems": []
  }
]
```

**Response (with checkConflicts)**
```json
{
  "schedules": [...],
  "hasConflict": true,
  "conflicts": [
    {
      "start": {
        "dateTime": "2024-01-15T10:30:00.000Z",
        "timeZone": "UTC"
      },
      "end": {
        "dateTime": "2024-01-15T11:30:00.000Z",
        "timeZone": "UTC"
      },
      "status": "busy",
      "subject": "Existing Meeting"
    }
  ]
}
```

**Status Codes**
- `200` - Success
- `401` - Unauthorized or token expired
- `500` - Server error

---

## Error Responses

### Standard Error Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User not authenticated |
| `TOKEN_EXPIRED` | Session expired, re-authentication required |
| `FETCH_FAILED` | Failed to fetch data from Microsoft Graph |
| `CHECK_FAILED` | Failed to check availability |
| `INVALID_REQUEST` | Missing required parameters |

---

## Rate Limiting

Microsoft Graph API has rate limits:
- **Per-user**: 2,000 requests per 10 seconds
- **Per-app**: 10,000 requests per 60 seconds

Exceeded limits return `429 Too Many Requests`.

---

## Authentication Flow

1. User clicks "Sign In"
2. Redirected to `/api/auth/signin`
3. Azure AD OAuth flow initiated
4. User authenticates with Microsoft
5. Callback to `/api/auth/callback/azure-ad`
6. Session created with access token
7. Token stored in encrypted cookie
8. Subsequent API calls use token from session

---

## Token Expiration Handling

Access tokens expire after ~1 hour. The application handles this gracefully:

1. API returns `TOKEN_EXPIRED` error
2. Client shows toast notification
3. Automatic sign-out after 2 seconds
4. Redirect to home page
5. User can sign in again

---

## Microsoft Graph Scopes

Required delegated permissions:
- `User.Read` - Read user profile
- `Calendars.ReadWrite` - Manage calendar events
- `OnlineMeetings.ReadWrite` - Create Teams meetings
- `Place.Read.All` - Read room information

---

## Best Practices

1. **Always handle token expiration** - Check for `TOKEN_EXPIRED` error code
2. **Use conflict detection** - Call `/api/availability` before updates
3. **Validate time ranges** - Ensure end time is after start time
4. **Handle async operations** - API calls may take 1-3 seconds
5. **Provide user feedback** - Show loading states and error messages

---

## Examples

### Complete Booking Flow

```javascript
// 1. Check availability
const checkResponse = await fetch('/api/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomEmails: ['room-a@company.com'],
    startTime: '2024-01-15T10:00:00.000Z',
    endTime: '2024-01-15T11:00:00.000Z',
    checkConflicts: true
  })
});

const availability = await checkResponse.json();

if (availability.hasConflict) {
  console.error('Time slot unavailable');
  return;
}

// 2. Create booking
const bookResponse = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Team Meeting',
    description: 'Weekly sync',
    attendees: ['user1@company.com'],
    start: '2024-01-15T10:00:00.000Z',
    end: '2024-01-15T11:00:00.000Z',
    roomEmail: 'room-a@company.com',
    roomId: 'room-123',
    isOnlineMeeting: true
  })
});

const booking = await bookResponse.json();
console.log('Booking created:', booking.id);
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/my-bookings');
  
  if (response.status === 401) {
    const error = await response.json();
    if (error.error === 'TOKEN_EXPIRED') {
      // Handle session expiration
      showToast('Session expired. Please sign in again.');
      setTimeout(() => signOut(), 2000);
      return;
    }
  }
  
  const bookings = await response.json();
  // Process bookings...
  
} catch (error) {
  console.error('Failed to fetch bookings:', error);
  showToast('An error occurred');
}
```

---

## Support

For API issues:
1. Check browser console for detailed errors
2. Verify Azure AD permissions
3. Review Microsoft Graph API documentation
4. Check server logs for backend errors
