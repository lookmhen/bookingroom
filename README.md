# Meeting Room Booking System

A modern, feature-rich meeting room booking application built with Next.js 14, integrating with Microsoft 365 for seamless calendar management and automatic Teams meeting creation.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Microsoft Graph](https://img.shields.io/badge/Microsoft-Graph%20API-0078D4?style=flat-square&logo=microsoft)

## ✨ Features

### Core Functionality
- 🏢 **Room Discovery** - Browse available meeting rooms with capacity information
- 📅 **Calendar Integration** - Full Microsoft 365 Calendar integration via Graph API
- 🎯 **Smart Booking** - Intuitive time slot selection with visual availability
- ✏️ **Edit & Cancel** - Manage existing bookings with ease
- 👥 **Attendee Management** - Add multiple attendees to meetings

### Advanced Features
- 🔍 **Search & Filter** - Find rooms by name, capacity, and sort options
- ⚠️ **Conflict Detection** - Real-time validation prevents double-bookings
- 💬 **Teams Meeting Toggle** - Automatically add Microsoft Teams meeting links
- 🔐 **Token Refresh Handling** - Graceful session expiration with auto sign-out
- ✅ **Confirmation Dialogs** - Prevent accidental booking cancellations
- 🎨 **Dark Mode** - Beautiful dark theme support
- 📱 **Responsive Design** - Optimized for desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Microsoft 365 account with admin access
- Azure AD App Registration

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookingroom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local` file in the root directory:
   ```env
   AZURE_AD_CLIENT_ID=your_client_id_here
   AZURE_AD_CLIENT_SECRET=your_client_secret_here
   AZURE_AD_TENANT_ID=your_tenant_id_here
   NEXTAUTH_SECRET=your_random_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Azure AD Configuration

### 1. Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Set name: "Meeting Room Booking"
5. Set Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
6. Click **Register**

### 2. Configure API Permissions

Add the following **Microsoft Graph** permissions:

**Delegated Permissions:**
- `User.Read` - Read user profile
- `Calendars.ReadWrite` - Read and write user calendars
- `OnlineMeetings.ReadWrite` - Create Teams meetings
- `Place.Read.All` - Read room lists

After adding permissions, click **Grant admin consent**.

### 3. Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the secret value (you won't see it again!)
4. Add to your `.env.local` as `AZURE_AD_CLIENT_SECRET`

### 4. Get Application IDs

- **Client ID**: Found in app registration Overview page
- **Tenant ID**: Found in Azure AD Overview page

## 📋 Available Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

See [docs/DOCKER-DEPLOYMENT.md](docs/DOCKER-DEPLOYMENT.md) for detailed instructions.

## 📖 Documentation

- **[README.md](README.md)** - Main documentation (this file)
- **[docs/API.md](docs/API.md)** - API Reference
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment Guide
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development Guide
- **[docs/DOCKER-DEPLOYMENT.md](docs/DOCKER-DEPLOYMENT.md)** - Docker Guide

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **API**: Microsoft Graph API
- **Date Handling**: date-fns
- **Icons**: Heroicons (SVG)

## ⚠️ Troubleshooting

### "Session expired" message

**Cause**: Access token expired (typically after 1 hour)

**Solution**: Application automatically signs you out. Simply sign in again.

### Rooms not loading

**Cause**: Missing API permissions or incorrect configuration

**Solution**: 
1. Check Azure AD permissions are granted
2. Verify `AZURE_AD_TENANT_ID` is correct
3. Check browser console for errors

### Booking creation fails

**Cause**: Insufficient permissions or invalid room email

**Solution**:
1. Ensure `Calendars.ReadWrite` permission is granted
2. Verify room email address is correct
3. Check if room calendar is accessible

### Teams meeting not created

**Cause**: Missing `OnlineMeetings.ReadWrite` permission

**Solution**: Add and grant the `OnlineMeetings.ReadWrite` permission in Azure AD

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js and Microsoft 365**
