# FinsERP Mobile (erp-mobile) - Scope & Guideline

## 1. Project Overview & Scope

**erp-mobile** is a Progressive Web Application (PWA) built with Next.js 15, designed to serve as the mobile interface for the **FinsERP** system. Its primary focus is on the **Fish Purchase Module**, facilitating vehicle booking, management, and operational workflows for field staff.

The app is tightly integrated with a **Laravel 10** backend (`tijara`) which serves as the central ERP system.

### Key Objectives:
-   **Mobile-First Operations**: Enable field staff to manage vehicle entries, inspections, and receiving processes on the go.
-   **Offline Capability**: Robust offline support using Service Workers to ensure functionality in low-connectivity environments.
-   **Real-time Updates**: Integration with push notifications and real-time data synchronization.
-   **Multi-language Support**: Built-in internationalization (i18n) for diverse user bases.

## 2. Technology Stack

### Frontend (erp-mobile)
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/) (Headless Components), [Lucide React](https://lucide.dev/) (Icons)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Client state), [TanStack Query](https://tanstack.com/query/latest) (Server state)
-   **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
-   **PWA**: Custom Service Worker implementation for caching and offline support.

### Backend (tijara - External Dependency)
-   **Framework**: Laravel 10 (PHP 8.2+)
-   **Authentication**: Laravel Sanctum (Token-based)
-   **Database**: MySQL

## 3. Architecture & Integration

The application follows a **Client-Server** architecture where `erp-mobile` consumes RESTful APIs provided by `tijara`.

-   **API Communication**: Uses `axios` with a centralized configuration (`lib/api.ts`) handling base URLs, interceptors for auth tokens, and standardized error handling.
-   **Authentication**: Implements a secure flow using Laravel Sanctum. Tokens are stored in `localStorage` (or cookies) and attached to every request.
-   **Service Layer**: Business logic is encapsulated in service files (e.g., `lib/services/vehicle-booking.ts`), keeping components clean and focused on UI.

## 4. Key Features & Modules

### 4.1. Fish Purchase Module
The core functionality currently implemented revolves around managing fish purchase logistics:
-   **Vehicle Booking**: Create and manage vehicle entries with details like vehicle number, supplier, driver, and estimated box count.
-   **Status Tracking**: Workflow states including `Pending`, `Received`, `Exited`, `Rejected`, and `Approved`.
-   **Receiving Process**: Record actual box counts and weight upon arrival.
-   **Dashboard**: View daily stats, capacity, and recent activities.

### 4.2. Core PWA Features
-   **Installable**: Manifest file allows adding the app to the home screen.
-   **Offline Mode**: Caches critical assets and API responses (Network First strategy) to allow viewing data without internet.
-   **Push Notifications**: Infrastructure for receiving alerts (e.g., booking approvals).

## 5. Directory Structure

```
erp-mobile/
├── src/
│   ├── app/                # Next.js App Router pages & layouts
│   │   ├── [locale]/       # Internationalized routes
│   │   └── offline/        # Offline fallback page
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI elements (Buttons, Inputs, etc.)
│   │   └── ...             # Feature-specific components
│   ├── hooks/              # Custom React hooks (e.g., useIsStandalone)
│   ├── lib/                # Utilities and configurations
│   │   ├── services/       # API service modules
│   │   └── api.ts          # Axios instance
│   ├── types/              # TypeScript definitions
│   └── i18n/               # Internationalization config
├── public/                 # Static assets (images, icons)
│   └── sw.js               # Service Worker script
├── messages/               # Translation files (en.json, etc.)
└── ...config files         # next.config.ts, tailwind.config.ts, etc.
```

## 6. Development Guidelines

### Adding New Features
1.  **Define Types**: Create interfaces in `src/types/` mirroring the backend API resources.
2.  **Create Service**: Implement API calls in `src/lib/services/` using the centralized `api` instance.
3.  **Build Components**: Create UI components in `src/components/`. Use existing UI primitives from `src/components/ui/`.
4.  **Create Page**: Add a new route in `src/app/[locale]/`. Use `useClient` for interactive pages.
5.  **State Management**: Use `useQuery` for fetching data and `useMutation` for updates.

### Best Practices
-   **Strict Typing**: Avoid `any`. Define proper interfaces for all data structures.
-   **Mobile First**: Design for touch interfaces and small screens first.
-   **Error Handling**: Handle API errors gracefully using the global error handler or try-catch blocks in components.
-   **Localization**: Wrap all text content in `t()` calls from `next-intl`.

## 7. Current Status & Roadmap
-   **Current Focus**: Stabilizing the Fish Purchase module and refining the offline experience.
-   **Documentation**: Refer to `FinsERP_DEVELOPMENT_GUIDELINES.md` for deep dives into specific patterns and backend integration details.
