# Development Guide

## Getting Started

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd bookingroom
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Azure AD credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Navigate to http://localhost:3000
   - Sign in with your Microsoft 365 account

---

## Project Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Authentication**: NextAuth.js
- **API**: Microsoft Graph API
- **Date Library**: date-fns

### Folder Structure

```
bookingroom/
├── app/                    # Next.js 14 App Router
│   ├── api/                # API routes (serverless functions)
│   ├── globals.css         # Global CSS and Tailwind directives
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home page
├── components/             # React components
├── lib/                    # Utilities and configurations
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

---

## Key Concepts

### App Router (Next.js 14)

This project uses the new App Router instead of Pages Router:

**File-based Routing:**
- `app/page.tsx` → `/`
- `app/api/rooms/route.ts` → `/api/rooms`
- `app/api/bookings/[id]/route.ts` → `/api/bookings/:id`

**Server Components by Default:**
- Components in `app/` are Server Components
- Use `"use client"` directive for Client Components
- Most of our components are Client Components for interactivity

### Authentication Flow

```
User → Sign In Button
  ↓
NextAuth.js → Azure AD OAuth
  ↓
Azure AD Login
  ↓
Callback → Create Session
  ↓
Encrypted Cookie → Access Token Stored
  ↓
Subsequent API Calls → Token from Session
```

### Microsoft Graph Integration

All calendar operations use Microsoft Graph API:

```typescript
// Initialize client with access token
const client = getGraphClient(accessToken);

// Example: Create event
const event = await client.api('/me/events').post({
  subject: 'Meeting',
  start: { dateTime: '2024-01-15T10:00:00', timeZone: 'UTC' },
  end: { dateTime: '2024-01-15T11:00:00', timeZone: 'UTC' },
});
```

---

## Component Guide

### Page Components

**app/page.tsx**
- Main entry point
- Checks authentication status
- Renders LoginButton or main interface
- Server Component that wraps Client Components

### UI Components

**LoginButton.tsx**
- Handles sign in/out
- Shows user avatar when signed in
- Uses NextAuth.js session

**RoomList.tsx**
- Displays available rooms
- Search, filter, and sort functionality
- Uses `useMemo` for performance

**BookingCalendar.tsx**
- New booking interface
- Time slot selection
- Availability checking
- Form for booking details
- Teams Meeting toggle

**BookingModal.tsx**
- View/edit existing bookings
- Full-width modal with `createPortal`
- Conflict detection on edit
- Teams Meeting toggle for updates

**MyBookings.tsx**
- Lists user's upcoming bookings
- Auto-refresh every 30 seconds
- Handles token expiration gracefully

**ConfirmDialog.tsx**
- Reusable confirmation dialog
- Danger/primary variants
- Portal-based rendering

**Toast.tsx**
- Non-blocking notifications
- Auto-dismiss after 3 seconds
- Success/error/info variants

---

## Development Patterns

### State Management

```typescript
// Component state
const [loading, setLoading] = useState(false);
const [data, setData] = useState<DataType[]>([]);

// Derived state with useMemo
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// Side effects
useEffect(() => {
  fetchData();
}, [dependency]);
```

### API Calls

```typescript
// Client-side API call
const response = await fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

if (response.ok) {
  const result = await response.json();
  // Handle success
} else {
  // Handle error
}
```

### Error Handling

```typescript
try {
  // API call
} catch (error: any) {
  console.error('Error:', error);
  
  // Check for token expiration
  if (error?.statusCode === 401 || error?.code === 'InvalidAuthenticationToken') {
    // Handle token expiration
    return NextResponse.json(
      { error: 'TOKEN_EXPIRED', message: 'Session expired' },
      { status: 401 }
    );
  }
  
  // Generic error
  return NextResponse.json(
    { error: 'FETCH_FAILED', message: 'Operation failed' },
    { status: 500 }
  );
}
```

### Date Handling

```typescript
import { format, addMinutes, startOfDay } from 'date-fns';

// Format date
const formatted = format(new Date(), 'yyyy-MM-dd HH:mm');

// Add time
const later = addMinutes(new Date(), 30);

// Start of day
const dayStart = startOfDay(new Date());
```

---

## Adding New Features

### 1. Add New API Endpoint

```typescript
// app/api/my-endpoint/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Your logic here
  return NextResponse.json({ data: 'result' });
}
```

### 2. Create New Component

```typescript
// components/MyComponent.tsx
"use client";

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div className="p-4 rounded-lg bg-white dark:bg-zinc-900">
      <h2 className="text-lg font-bold">{title}</h2>
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Click Me
      </button>
    </div>
  );
}
```

### 3. Add Type Definitions

```typescript
// types/index.ts
export interface MyNewType {
  id: string;
  name: string;
  createdAt: string;
}
```

---

## Styling Guide

### Tailwind CSS Best Practices

```typescript
// Conditional classes
<div className={`p-4 rounded-lg ${
  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
}`}>
```

```typescript
// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

```typescript
// Dark mode
<div className="bg-white dark:bg-zinc-900 text-gray-800 dark:text-white">
```

### Common Patterns

**Card:**
```typescript
<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700 p-6">
```

**Button:**
```typescript
<button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-lg">
```

**Input:**
```typescript
<input className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none" />
```

---

## Testing

### Manual Testing Checklist

- [ ] Sign in/out works
- [ ] Rooms load correctly
- [ ] Can create booking
- [ ] Can edit booking
- [ ] Can cancel booking
- [ ] Conflict detection works
- [ ] Teams meeting toggle works
- [ ] Search and filter work
- [ ] Toast notifications appear
- [ ] Modal animations smooth
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] Token expiration handled

### Testing API Endpoints

```bash
# Test with curl
curl -X GET http://localhost:3000/api/rooms \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"subject":"Test","start":"2024-01-15T10:00:00Z","end":"2024-01-15T11:00:00Z"}'
```

---

## Common Tasks

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update all to latest
npm update

# Update specific package
npm install package-name@latest
```

### Add New Package

```bash
# Install and save to package.json
npm install package-name

# Install dev dependency
npm install -D package-name
```

### Clear Cache

```bash
# Delete build artifacts
rm -rf .next

# Delete node_modules
rm -rf node_modules
npm install
```

### Generate Types from Graph API

```bash
# If needed, install Microsoft Graph types
npm install -D @microsoft/microsoft-graph-types
```

---

## Debugging

### Browser DevTools

**Console:**
- Check for JavaScript errors
- View API response data
- Inspect logged values

**Network Tab:**
- Monitor API calls
- Check request/response headers
- View response data

**React DevTools:**
- Inspect component props
- View component state
- Check re-renders

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Common Issues

**"Module not found":**
- Check import paths
- Ensure package is installed
- Restart dev server

**"Hydration failed":**
- Server and client HTML mismatch
- Check for `useEffect` missing dependencies
- Ensure consistent rendering

**"Cannot read property of undefined":**
- Add optional chaining: `obj?.property`
- Check data is loaded before rendering
- Add loading states

---

## Performance Optimization

### Code Splitting

```typescript
// Dynamic import
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable SSR if not needed
});
```

### Memoization

```typescript
// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return data.map(/* complex transformation */);
}, [data]);

// useCallback for function references
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  quality={85}
  priority={false}
/>
```

---

## Best Practices

1. **TypeScript**: Always define interfaces for props and data
2. **Error Handling**: Wrap API calls in try-catch
3. **Loading States**: Show feedback during async operations
4. **Accessibility**: Use semantic HTML and ARIA attributes
5. **Code Organization**: Keep components focused and reusable
6. **Comments**: Document complex logic
7. **Git Commits**: Write clear, descriptive commit messages
8. **Environment Variables**: Never commit secrets

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**Happy coding! 🚀**
