# FinsERP Development Guidelines & Architecture Reference

This document serves as the complete development reference for the FinsERP system, covering the integration between the **finserp-mobile** Next.js PWA and **tijara** Laravel backend. Use this document to maintain consistency, quality, and architectural integrity across the system.

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack](#technology-stack)
3. [PWA-Laravel Integration Patterns](#pwa-laravel-integration-patterns)
4. [Authentication & Security](#authentication--security)
5. [API Design Patterns](#api-design-patterns)
6. [Frontend Development Standards](#frontend-development-standards)
7. [Backend Development Standards](#backend-development-standards)
8. [Database Design Patterns](#database-design-patterns)
9. [Service Layer Architecture](#service-layer-architecture)
10. [PWA Features Implementation](#pwa-features-implementation)
11. [Testing Strategies](#testing-strategies)
12. [Deployment & Environment](#deployment--environment)
13. [Development Workflows](#development-workflows)
14. [Code Quality Standards](#code-quality-standards)
15. [Performance Optimization](#performance-optimization)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────┐    HTTP/HTTPS    ┌─────────────────────┐
│   finserp-mobile    │◄──── API ──────►│       tijara        │
│   (Next.js PWA)     │                  │   (Laravel 10)      │
│                     │                  │                     │
│ • Progressive Web   │                  │ • RESTful API       │
│   App               │                  │ • Modular Monolith  │
│ • Service Worker    │                  │ • Sanctum Auth      │
│ • Offline Support   │                  │ • MySQL Database    │
│ • Push Notifications│                  │ • Queue Jobs        │
└─────────────────────┘                  └─────────────────────┘
```

### Core Components

#### finserp-mobile (PWA Frontend)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Architecture**: Progressive Web Application
- **Primary Function**: Mobile-optimized vehicle booking and management system

#### tijara (Laravel Backend)
- **Framework**: Laravel 10+ with PHP 8.2+
- **Architecture**: Modular monolith with `fmsaas` module
- **Primary Function**: ERP backend serving multiple business modules

---

## Technology Stack

### Frontend Stack (finserp-mobile)

```typescript
// Core Technologies
"next": "15.5.5"                    // React framework with App Router
"react": "19.1.0"                   // UI library
"typescript": "^5"                  // Type safety

// UI Framework
"tailwindcss": "^4"                 // Utility-first CSS
"@radix-ui/react-*"                 // Headless UI components
"lucide-react": "^0.545.0"          // Icon library

// State Management
"zustand": "^5.0.8"                 // Lightweight state management
"@tanstack/react-query": "^5.90.3"  // Server state management

// Internationalization
"next-intl": "^4.3.12"              // i18n support

// HTTP Client
"axios": "^1.12.2"                  // API communication

// Utilities
"class-variance-authority": "^0.7.1" // Conditional classes
"clsx": "^2.1.1"                    // Class name utility
"tailwind-merge": "^3.3.1"          // Tailwind class merging
```

### Backend Stack (tijara)

```php
// Core Framework
"laravel/framework": "^10.8"
"php": "^8.2"

// Authentication & API
"laravel/sanctum": "^3.2"           // API authentication
"inertiajs/inertia-laravel": "^0.6.8" // SPA integration

// Database & Files
"spatie/laravel-medialibrary": "^11.0.0"  // File management
"maatwebsite/excel": "^3.1"         // Excel import/export
"barryvdh/laravel-dompdf": "^3.0"   // PDF generation

// Permissions & Audit
"spatie/laravel-permission": "^5.10" // Role-based access
"spatie/laravel-activitylog": "^4.7" // Audit logging

// Utilities
"spatie/laravel-settings": "^3.1"   // Application settings
"tightenco/ziggy": "^1.0"           // Route generation for JS
```

---

## PWA-Laravel Integration Patterns

### API Communication Architecture

#### 1. Axios Configuration

```typescript
// lib/api.ts
import axios from "axios"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Important for Laravel Sanctum
})

// Request interceptor for auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### 2. Service Layer Pattern

```typescript
// lib/services/vehicle-booking.ts
export const vehicleBookingService = {
  getBookings: async (filters?: BookingFilters): Promise<PaginatedResponse<VehicleBooking>> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.status && filters.status !== "all") params.append("status", filters.status)

    const response = await api.get<PaginatedResponse<VehicleBooking>>(
      `/fish-purchase-vehicles?${params.toString()}`
    )
    return response.data
  },

  createBooking: async (data: CreateBookingRequest): Promise<VehicleBooking> => {
    const response = await api.post<ApiResponse<VehicleBooking>>(
      `/fish-purchase-vehicles`,
      data
    )
    return response.data.data!
  },
}
```

#### 3. Error Handling Pattern

```typescript
// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = "An error occurred. Please try again."

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.errors) {
      // Handle Laravel validation errors
      const errors = error.response.data.errors
      const firstError = Object.values(errors)[0]
      errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token")
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)
```

---

## Authentication & Security

### Laravel Sanctum Implementation

#### Backend Authentication Controller

```php
<?php
// app/Http/Controllers/Api/AuthController.php

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'boolean',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
```

#### Frontend Authentication Service

```typescript
// lib/services/auth.ts
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials)
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/logout')
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/user')
    return response.data
  },
}
```

### Security Best Practices

1. **Token Storage**: Use `localStorage` for auth tokens with automatic cleanup on 401
2. **CORS Configuration**: Properly configured for PWA domain
3. **Input Validation**: Both frontend and backend validation
4. **Rate Limiting**: Implemented on Laravel API routes
5. **HTTPS Only**: All production communications over HTTPS

---

## API Design Patterns

### RESTful API Structure

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    // Resource routes
    Route::get('/fish-purchase-vehicles', [FishPurchaseVehicleController::class, 'index']);
    Route::post('/fish-purchase-vehicles', [FishPurchaseVehicleController::class, 'store']);
    Route::get('/fish-purchase-vehicles/{id}', [FishPurchaseVehicleController::class, 'show']);
    Route::put('/fish-purchase-vehicles/{id}', [FishPurchaseVehicleController::class, 'update']);
    Route::delete('/fish-purchase-vehicles/{id}', [FishPurchaseVehicleController::class, 'destroy']);

    // Action routes
    Route::post('/fish-purchase-vehicles/{id}/receive', [FishPurchaseVehicleController::class, 'receive']);
    Route::post('/fish-purchase-vehicles/{id}/reject', [FishPurchaseVehicleController::class, 'reject']);
    Route::post('/fish-purchase-vehicles/{id}/approve', [FishPurchaseVehicleController::class, 'approve']);

    // Utility routes
    Route::get('/fish-purchase-vehicles/stats', [FishPurchaseVehicleController::class, 'stats']);
    Route::get('/fish-purchase-vehicles/daily-capacity', [FishPurchaseVehicleController::class, 'dailyCapacity']);
});
```

### Response Standardization

#### Success Response Format

```php
// Consistent API response structure
return response()->json([
    'success' => true,
    'data' => $data,
    'meta' => [
        'current_page' => $page,
        'per_page' => $perPage,
        'total' => $total,
        'last_page' => ceil($total / $perPage),
    ]
]);
```

#### Error Response Format

```php
// Laravel validation errors
return response()->json([
    'message' => 'The given data was invalid.',
    'errors' => [
        'field_name' => ['Error message here']
    ]
], 422);
```

---

## Frontend Development Standards

### Component Architecture

#### 1. Page Components (App Router)

```typescript
// app/[locale]/vehicle-bookings/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { vehicleBookingService } from "@/lib/services/vehicle-booking"
import type { VehicleBooking, BookingFilters } from "@/types/vehicle-booking"

export default function VehicleBookingsPage() {
  const t = useTranslations('vehicleBookings')
  const [bookings, setBookings] = useState<VehicleBooking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await vehicleBookingService.getBookings()
      setBookings(response.data)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1>{t('title')}</h1>
      {/* Component content */}
    </div>
  )
}
```

#### 2. Reusable UI Components

```typescript
// components/ui/button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button, buttonVariants }
```

### TypeScript Patterns

#### 1. Strict Type Definitions

```typescript
// types/vehicle-booking.ts
export interface VehicleBooking {
  id: number
  vehicle_number: string
  entry_date: string
  entry_datetime: string
  box_count: number
  actual_box_count?: number
  weight_tons: number
  driver_name: string
  driver_phone: string
  supplier_name: string
  supplier_phone: string
  status: 'pending' | 'received' | 'exited' | 'rejected' | 'approved'
  received_at?: string
  received_by?: number
  exited_at?: string
  exited_by?: number
  rejected_at?: string
  rejected_by?: number
  rejection_reason?: string
  created_by: number
  notes?: string
  approved_by?: number
  approved_at?: string
  approval_notes?: string
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}
```

#### 2. Custom Hooks

```typescript
// hooks/use-is-standalone.ts
"use client"

import { useEffect, useState } from "react"

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')

    setIsStandalone(standalone)

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isStandalone
}
```

---

## Backend Development Standards

### Model Architecture

#### 1. Eloquent Models

```php
<?php
// modules/fmsaas/src/Models/FishPurchase/FishPurchaseVehicle.php

namespace Techniasoft\Fmsaas\Models\FishPurchase;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FishPurchaseVehicle extends Model
{
    use SoftDeletes;

    protected $table = 'fish_purchase_vehicles';

    protected $fillable = [
        'vehicle_number',
        'entry_date',
        'entry_datetime',
        'box_count',
        'actual_box_count',
        'weight_tons',
        'driver_name',
        'driver_phone',
        'supplier_name',
        'supplier_phone',
        'status',
        'received_at',
        'received_by',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'entry_datetime' => 'datetime',
        'box_count' => 'integer',
        'actual_box_count' => 'integer',
        'weight_tons' => 'decimal:3',
        'received_at' => 'datetime',
    ];

    protected $appends = [
        'can_receive',
        'can_edit',
        'can_delete',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Business logic methods
    public function getCanReceiveAttribute(): bool
    {
        return $this->status === 'pending';
    }

    public function receive(int $userId, ?int $actualBoxCount = null): void
    {
        $this->update([
            'status' => 'received',
            'received_at' => now(),
            'received_by' => $userId,
            'actual_box_count' => $actualBoxCount ?? $this->box_count,
        ]);
    }
}
```

#### 2. Controller Pattern

```php
<?php
// modules/fmsaas/src/Http/Controllers/Fish/FishPurchaseVehicleController.php

namespace Techniasoft\Fmsaas\Http\Controllers\Fish;

use App\Http\Controllers\Controller;
use Techniasoft\Fmsaas\Models\FishPurchase\FishPurchaseVehicle;
use Techniasoft\Fmsaas\Services\FishPurchase\FishPurchaseVehicleService;
use Techniasoft\Fmsaas\Http\Requests\FishPurchase\CreateFishPurchaseVehicleRequest;
use Illuminate\Http\Request;

class FishPurchaseVehicleController extends Controller
{
    public function __construct(
        private FishPurchaseVehicleService $vehicleService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'status', 'date_from', 'date_to']);
        $perPage = $request->get('per_page', 20);

        $vehicles = FishPurchaseVehicle::query()
            ->with(['creator', 'receiver'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('vehicle_number', 'like', "%{$search}%")
                      ->orWhere('driver_name', 'like', "%{$search}%")
                      ->orWhere('supplier_name', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($filters['date_from'] ?? null, function ($query, $date) {
                $query->whereDate('entry_date', '>=', $date);
            })
            ->when($filters['date_to'] ?? null, function ($query, $date) {
                $query->whereDate('entry_date', '<=', $date);
            })
            ->orderByDesc('entry_datetime')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $vehicles->items(),
            'meta' => [
                'current_page' => $vehicles->currentPage(),
                'per_page' => $vehicles->perPage(),
                'total' => $vehicles->total(),
                'last_page' => $vehicles->lastPage(),
            ]
        ]);
    }

    public function store(CreateFishPurchaseVehicleRequest $request)
    {
        $vehicle = $this->vehicleService->create($request->validated());

        return response()->json([
            'success' => true,
            'data' => $vehicle,
            'message' => 'Vehicle booking created successfully'
        ], 201);
    }

    public function receive(Request $request, FishPurchaseVehicle $vehicle)
    {
        $request->validate([
            'actual_box_count' => 'nullable|integer|min:0'
        ]);

        $vehicle->receive(auth()->id(), $request->actual_box_count);

        return response()->json([
            'success' => true,
            'data' => $vehicle->fresh(['creator', 'receiver']),
            'message' => 'Vehicle received successfully'
        ]);
    }
}
```

#### 3. Service Layer Pattern

```php
<?php
// modules/fmsaas/src/Services/FishPurchase/FishPurchaseVehicleService.php

namespace Techniasoft\Fmsaas\Services\FishPurchase;

use Techniasoft\Fmsaas\Models\FishPurchase\FishPurchaseVehicle;
use Illuminate\Support\Facades\DB;

class FishPurchaseVehicleService
{
    public function create(array $data): FishPurchaseVehicle
    {
        return DB::transaction(function () use ($data) {
            $vehicle = FishPurchaseVehicle::create([
                ...$data,
                'created_by' => auth()->id(),
                'status' => 'pending',
            ]);

            // Additional business logic
            $this->notifyStakeholders($vehicle);

            return $vehicle->fresh(['creator']);
        });
    }

    public function getDashboardStats(?string $date = null): array
    {
        $date = $date ?: now()->toDateString();

        $query = FishPurchaseVehicle::whereDate('entry_date', $date);

        return [
            'total_vehicles' => $query->count(),
            'pending' => $query->where('status', 'pending')->count(),
            'received' => $query->where('status', 'received')->count(),
            'exited' => $query->where('status', 'exited')->count(),
            'rejected' => $query->where('status', 'rejected')->count(),
        ];
    }

    private function notifyStakeholders(FishPurchaseVehicle $vehicle): void
    {
        // Notification logic
    }
}
```

---

## PWA Features Implementation

### Service Worker Configuration

```javascript
// public/sw.js
const CACHE_NAME = "finserp-cache-v1";
const OFFLINE_URL = "/offline";

// Cache important assets during install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/offline",
        "/manifest.json",
        "/icon-192x192.png",
        "/icon-512x512.png",
      ]);
    })
  );
  self.skipWaiting();
});

// Handle fetch events with Network First strategy
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension://")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) return response;
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
```

### PWA Manifest

```json
{
  "name": "FinsERP Mobile",
  "short_name": "FinsERP",
  "description": "ERP Mobile Progressive Web App for managing vehicle bookings and operations",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "scope": "/",
  "categories": ["business", "productivity"],
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Push Notifications

#### Backend Implementation

```php
<?php
// app/Http/Controllers/Api/PushSubscriptionController.php

class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = auth()->user();

        $user->pushSubscriptions()->updateOrCreate(
            ['endpoint' => $request->endpoint],
            [
                'p256dh_key' => $request->keys['p256dh'],
                'auth_token' => $request->keys['auth'],
            ]
        );

        return response()->json(['message' => 'Subscription saved']);
    }
}
```

#### Frontend Implementation

```typescript
// lib/services/push-notification.ts
export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  static async subscribe(): Promise<void> {
    if (!('serviceWorker' in navigator)) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
    })

    // Send subscription to backend
    await api.post('/push-subscriptions', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!)
      }
    })
  }

  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)))
  }
}
```

---

## Database Design Patterns

### Migration Standards

```php
<?php
// database/migrations/create_fish_purchase_vehicles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fish_purchase_vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_number', 50)->index();
            $table->date('entry_date')->index();
            $table->datetime('entry_datetime');
            $table->integer('box_count')->unsigned();
            $table->integer('actual_box_count')->unsigned()->nullable();
            $table->decimal('weight_tons', 8, 3);
            $table->string('driver_name', 100);
            $table->string('driver_phone', 20);
            $table->string('supplier_name', 100);
            $table->string('supplier_phone', 20);
            $table->enum('status', ['pending', 'received', 'exited', 'rejected', 'approved'])
                   ->default('pending')
                   ->index();
            $table->datetime('received_at')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users');
            $table->datetime('exited_at')->nullable();
            $table->foreignId('exited_by')->nullable()->constrained('users');
            $table->datetime('rejected_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->datetime('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index(['status', 'entry_date']);
            $table->index(['created_by', 'entry_date']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fish_purchase_vehicles');
    }
};
```

---

## Code Quality Standards

### The NO COMMENTS Policy

**CRITICAL RULE**: Do not add comments to code unless explicitly requested. Code should be self-documenting through:

1. **Clear naming conventions**
2. **Single responsibility principle**
3. **Descriptive variable and function names**
4. **Proper code structure**

#### Good Example (No Comments Needed)

```typescript
const calculateTotalWeight = (vehicles: VehicleBooking[]): number => {
  return vehicles
    .filter(vehicle => vehicle.status === 'received')
    .reduce((total, vehicle) => total + vehicle.weight_tons, 0)
}

const isVehicleEligibleForApproval = (vehicle: VehicleBooking): boolean => {
  return vehicle.status === 'received' &&
         vehicle.actual_box_count !== null &&
         vehicle.weight_tons > 0
}
```

#### Bad Example (Over-commented)

```typescript
// Calculate the total weight of all received vehicles
const calculateTotalWeight = (vehicles: VehicleBooking[]): number => {
  // Filter only received vehicles
  return vehicles
    .filter(vehicle => vehicle.status === 'received') // Only received status
    .reduce((total, vehicle) => total + vehicle.weight_tons, 0) // Sum weights
}
```

### Naming Conventions

#### TypeScript/JavaScript
- **Variables**: `camelCase`
- **Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

#### PHP/Laravel
- **Variables**: `$camelCase`
- **Methods**: `camelCase`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Database tables**: `snake_case`
- **Database columns**: `snake_case`

---

## Development Workflows

### Feature Development Process

#### 1. Backend API Development

```bash
# Step 1: Create migration
php artisan make:migration create_new_feature_table

# Step 2: Create model
php artisan make:model NewFeature

# Step 3: Create controller
php artisan make:controller Api/NewFeatureController

# Step 4: Create request classes
php artisan make:request StoreNewFeatureRequest
php artisan make:request UpdateNewFeatureRequest

# Step 5: Create service class
# Manually create in Services namespace

# Step 6: Add routes
# Add to routes/api.php

# Step 7: Run migration
php artisan migrate

# Step 8: Test with Postman/Thunder Client
```

#### 2. Frontend Feature Development

```bash
# Step 1: Create types
# Add to src/types/

# Step 2: Create service
# Add to src/lib/services/

# Step 3: Create page component
# Add to src/app/[locale]/

# Step 4: Create UI components
# Add to src/components/

# Step 5: Add translations
# Add to messages/

# Step 6: Test in browser
npm run dev
```

### Testing Strategy

#### Backend Testing

```php
<?php
// tests/Feature/VehicleBookingTest.php

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class VehicleBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_vehicle_booking(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/fish-purchase-vehicles', [
                'vehicle_number' => 'ABC-123',
                'entry_date' => now()->toDateString(),
                'entry_datetime' => now()->toDateTimeString(),
                'box_count' => 100,
                'weight_tons' => 5.5,
                'driver_name' => 'John Doe',
                'driver_phone' => '1234567890',
                'supplier_name' => 'Test Supplier',
                'supplier_phone' => '0987654321',
            ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'id',
                        'vehicle_number',
                        'status',
                        'created_by'
                    ]
                ]);

        $this->assertDatabaseHas('fish_purchase_vehicles', [
            'vehicle_number' => 'ABC-123',
            'status' => 'pending',
            'created_by' => $user->id,
        ]);
    }
}
```

#### Frontend Testing (Jest + React Testing Library)

```typescript
// __tests__/components/vehicle-booking/booking-card.test.tsx

import { render, screen } from '@testing-library/react'
import { BookingCard } from '@/components/vehicle-booking/booking-card'
import { VehicleBooking } from '@/types/vehicle-booking'

const mockBooking: VehicleBooking = {
  id: 1,
  vehicle_number: 'ABC-123',
  status: 'pending',
  driver_name: 'John Doe',
  supplier_name: 'Test Supplier',
  box_count: 100,
  weight_tons: 5.5,
  entry_date: '2024-01-01',
  entry_datetime: '2024-01-01T10:00:00Z',
  created_by: 1,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
}

describe('BookingCard', () => {
  it('displays vehicle information correctly', () => {
    render(<BookingCard booking={mockBooking} />)

    expect(screen.getByText('ABC-123')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Test Supplier')).toBeInTheDocument()
    expect(screen.getByText('100 boxes')).toBeInTheDocument()
    expect(screen.getByText('5.5 tons')).toBeInTheDocument()
  })

  it('shows pending status badge', () => {
    render(<BookingCard booking={mockBooking} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toHaveClass('bg-yellow-100')
  })
})
```

---

## Performance Optimization

### Frontend Optimization

#### 1. Code Splitting and Lazy Loading

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const VehicleBookingChart = dynamic(
  () => import('@/components/charts/vehicle-booking-chart'),
  {
    loading: () => <div>Loading chart...</div>,
    ssr: false
  }
)

// Page-level code splitting is automatic with App Router
```

#### 2. React Query for Server State

```typescript
// hooks/use-vehicle-bookings.ts
import { useQuery } from '@tanstack/react-query'
import { vehicleBookingService } from '@/lib/services/vehicle-booking'

export function useVehicleBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: ['vehicle-bookings', filters],
    queryFn: () => vehicleBookingService.getBookings(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}
```

#### 3. Optimistic Updates

```typescript
const updateBookingMutation = useMutation({
  mutationFn: vehicleBookingService.updateBooking,
  onMutate: async (variables) => {
    await queryClient.cancelQueries(['vehicle-bookings'])

    const previousBookings = queryClient.getQueryData(['vehicle-bookings'])

    queryClient.setQueryData(['vehicle-bookings'], (old: any) => ({
      ...old,
      data: old.data.map((booking: VehicleBooking) =>
        booking.id === variables.id
          ? { ...booking, ...variables.data }
          : booking
      )
    }))

    return { previousBookings }
  },
  onError: (err, variables, context) => {
    if (context?.previousBookings) {
      queryClient.setQueryData(['vehicle-bookings'], context.previousBookings)
    }
  },
})
```

### Backend Optimization

#### 1. Eager Loading

```php
// Prevent N+1 queries
$vehicles = FishPurchaseVehicle::with(['creator', 'receiver', 'approver'])
    ->latest()
    ->paginate(20);
```

#### 2. Database Indexing

```php
// Add indexes for frequently queried columns
$table->index(['status', 'entry_date']);
$table->index(['created_by', 'entry_date']);
$table->index('vehicle_number');
```

#### 3. Query Optimization

```php
// Use specific columns instead of SELECT *
$vehicles = FishPurchaseVehicle::select([
    'id', 'vehicle_number', 'status', 'entry_date',
    'box_count', 'weight_tons', 'created_by'
])->with(['creator:id,name'])->get();
```

---

## Internationalization (i18n)

### Next.js Internationalization

#### Configuration

```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // config options
};

export default withNextIntl(nextConfig);
```

#### Translation Files

```json
// messages/en.json
{
  "vehicleBookings": {
    "title": "Vehicle Bookings",
    "newBooking": "New Booking",
    "vehicleNumber": "Vehicle Number",
    "driverName": "Driver Name",
    "supplierName": "Supplier Name",
    "status": {
      "pending": "Pending",
      "received": "Received",
      "exited": "Exited",
      "rejected": "Rejected",
      "approved": "Approved"
    },
    "actions": {
      "receive": "Receive",
      "reject": "Reject",
      "approve": "Approve",
      "exit": "Exit"
    }
  }
}
```

#### Usage in Components

```typescript
import { useTranslations } from 'next-intl'

export default function VehicleBookingPage() {
  const t = useTranslations('vehicleBookings')

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('newBooking')}</button>
    </div>
  )
}
```

---

## Environment Configuration

### Development Setup

#### Backend (.env)

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://tijara.test

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=uf_erp
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1,tijara.test,finserp-mobile.test
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://tijara.test/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
```

### Production Considerations

1. **HTTPS Only**: All communications must use HTTPS
2. **CORS Configuration**: Proper domain whitelisting
3. **Rate Limiting**: API rate limits for security
4. **Error Logging**: Comprehensive error tracking
5. **Performance Monitoring**: Application performance monitoring

---

## Key Architectural Decisions

### 1. PWA vs Native App
- **Decision**: Progressive Web App
- **Rationale**: Faster development, cross-platform compatibility, easier maintenance
- **Trade-offs**: Limited native features, but sufficient for business requirements

### 2. Monorepo vs Separate Repositories
- **Decision**: Separate repositories
- **Rationale**: Different deployment cycles, team ownership, technology stacks
- **Trade-offs**: Potential for version drift, but better separation of concerns

### 3. State Management
- **Decision**: React Query + Zustand
- **Rationale**: React Query for server state, Zustand for client state
- **Trade-offs**: Learning curve, but excellent developer experience

### 4. Authentication Strategy
- **Decision**: Laravel Sanctum with Bearer tokens
- **Rationale**: Simple, secure, stateless authentication for SPA
- **Trade-offs**: Token management complexity, but excellent security

### 5. Database Strategy
- **Decision**: Single MySQL database with modular schema
- **Rationale**: Simpler deployment, strong consistency, familiar technology
- **Trade-offs**: Potential scaling limitations, but suitable for current needs

---

## Conclusion

This document serves as the comprehensive reference for developing and maintaining the FinsERP system. The architecture emphasizes:

1. **Security First**: Authentication, validation, and secure communication
2. **Developer Experience**: Type safety, clear patterns, excellent tooling
3. **Performance**: Optimized queries, caching, code splitting
4. **Maintainability**: Clear separation of concerns, consistent patterns
5. **Scalability**: Modular architecture, efficient data access patterns

Always refer to this document when making architectural decisions or implementing new features to ensure consistency across the FinsERP ecosystem.

## Quick Reference Commands

### Laravel (tijara)
```bash
# Development server
php artisan serve

# Run migrations
php artisan migrate

# Create components
php artisan make:model ModelName
php artisan make:controller ControllerName
php artisan make:request RequestName

# Run tests
php artisan test
```

### Next.js (finserp-mobile)
```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Database
```bash
# Create migration
php artisan make:migration create_table_name

# Rollback migration
php artisan migrate:rollback

# Fresh migration
php artisan migrate:fresh --seed
```

---

*Last updated: October 2024*
*Version: 1.0*