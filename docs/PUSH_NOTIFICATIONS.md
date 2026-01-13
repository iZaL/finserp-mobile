# Push Notifications Implementation Guide

This document describes the push notification system implemented in the ERP Mobile app and the required backend API endpoints.

## Overview

The mobile app now supports push notifications for vehicle booking events. When a new vehicle is booked, all subscribed users will receive a push notification on their devices.

**Note**: This implementation uses a custom service worker compatible with Next.js 15, without relying on deprecated packages like next-pwa.

## Frontend Implementation

### Files Created/Updated

1. **`src/lib/services/push-notification.ts`** - Core push notification service functions
2. **`src/hooks/use-push-notification.ts`** - React hook for managing push notifications
3. **`src/components/notification-settings.tsx`** - UI component for enabling/disabling notifications
4. **`src/components/service-worker-register.tsx`** - Custom service worker registration (Next.js 15 compatible)
5. **`public/sw.js`** - Standalone service worker with push notification handlers and offline support
6. **`src/app/[locale]/layout.tsx`** - Main layout with service worker registration

### How It Works

1. Service worker is automatically registered when the app loads (works in both dev and production)
2. User clicks "Enable Notifications" button on the vehicle bookings page
3. Browser requests notification permission
4. User grants permission
5. App subscribes to push notifications using the browser's PushManager
6. Subscription details are sent to the backend API
7. Backend stores the subscription and can now send push notifications to this device

### Key Changes from Previous Implementation

- **Removed next-pwa**: The deprecated next-pwa package has been removed due to incompatibility with Next.js 15 and Turbopack
- **Custom Registration**: Service worker is now registered using a custom React component
- **Works in Development**: Service worker now works in development mode (not disabled)
- **Standalone SW**: Service worker doesn't depend on any external libraries (workbox, etc.)

## Backend Requirements

### 1. VAPID Keys Setup

Generate VAPID (Voluntary Application Server Identification) keys for secure push notifications:

```bash
# Install web-push library
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BN...
Private Key: 3T...
```

**Configuration:**
- Add the **Public Key** to `.env.local` in the mobile app:
  ```
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
  ```
- Add **both keys** to your Laravel backend `.env`:
  ```
  VAPID_PUBLIC_KEY=BN...
  VAPID_PRIVATE_KEY=3T...
  VAPID_SUBJECT=mailto:your-email@example.com
  ```

### 2. Required Database Schema

Create a table to store push notification subscriptions:

```sql
CREATE TABLE push_subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    endpoint VARCHAR(500) NOT NULL UNIQUE,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

**Laravel Migration:**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('endpoint', 500)->unique();
            $table->string('p256dh_key');
            $table->string('auth_key');
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
```

### 3. Required API Endpoints

#### A. Store Push Subscription

**Endpoint:** `POST /api/push-subscriptions`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BN4GvZt...",
    "auth": "k8J..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription saved successfully"
}
```

**Laravel Controller Example:**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string|max:500',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        PushSubscription::updateOrCreate(
            [
                'endpoint' => $validated['endpoint'],
            ],
            [
                'user_id' => Auth::id(),
                'p256dh_key' => $validated['keys']['p256dh'],
                'auth_key' => $validated['keys']['auth'],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Subscription saved successfully',
        ]);
    }

    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('endpoint', $validated['endpoint'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription removed successfully',
        ]);
    }
}
```

#### B. Delete Push Subscription

**Endpoint:** `DELETE /api/push-subscriptions`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription removed successfully"
}
```

### 4. Sending Push Notifications

Install the web-push package in your Laravel backend:

```bash
composer require minishlink/web-push
```

**Service Class Example:**

```php
<?php

namespace App\Services;

use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    public function sendToUser(int $userId, array $payload)
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        foreach ($subscriptions as $sub) {
            $this->sendNotification($sub, $payload);
        }
    }

    public function sendToAll(array $payload)
    {
        $subscriptions = PushSubscription::all();

        foreach ($subscriptions as $sub) {
            $this->sendNotification($sub, $payload);
        }
    }

    private function sendNotification(PushSubscription $subscription, array $payload)
    {
        $auth = [
            'VAPID' => [
                'subject' => config('services.vapid.subject'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ];

        $webPush = new WebPush($auth);

        $sub = Subscription::create([
            'endpoint' => $subscription->endpoint,
            'keys' => [
                'p256dh' => $subscription->p256dh_key,
                'auth' => $subscription->auth_key,
            ],
        ]);

        $result = $webPush->sendOneNotification(
            $sub,
            json_encode($payload)
        );

        // Handle expired subscriptions
        if (!$result->isSuccess()) {
            \Log::warning('Push notification failed', [
                'endpoint' => $subscription->endpoint,
                'reason' => $result->getReason(),
            ]);

            // Remove invalid subscriptions
            if ($result->isSubscriptionExpired()) {
                $subscription->delete();
            }
        }
    }
}
```

**Configuration (config/services.php):**

```php
'vapid' => [
    'subject' => env('VAPID_SUBJECT', 'mailto:admin@example.com'),
    'public_key' => env('VAPID_PUBLIC_KEY'),
    'private_key' => env('VAPID_PRIVATE_KEY'),
],
```

### 5. Triggering Notifications on Vehicle Booking

Update your vehicle booking creation logic to send push notifications:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FishPurchaseVehicle;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;

class FishPurchaseVehicleController extends Controller
{
    protected $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    public function store(Request $request)
    {
        // ... validation and booking creation logic ...

        $booking = FishPurchaseVehicle::create($validated);

        // Send push notification to all users
        $this->pushService->sendToAll([
            'title' => 'New Vehicle Booked',
            'body' => "Vehicle {$booking->vehicle_number} has been booked",
            'icon' => '/icon-192x192.png',
            'badge' => '/icon-144x144.png',
            'tag' => 'vehicle-booking',
            'data' => [
                'url' => '/vehicle-bookings',
                'booking_id' => $booking->id,
            ],
        ]);

        return response()->json($booking, 201);
    }
}
```

## Testing

### 1. Setup

1. Generate VAPID keys and add to `.env` files
2. Run migrations to create `push_subscriptions` table
3. Install `minishlink/web-push` package

### 2. Test Flow

1. Open the mobile app and navigate to vehicle bookings
2. Click "Enable Notifications"
3. Grant notification permission when prompted
4. Check the database - you should see a new row in `push_subscriptions`
5. Create a new vehicle booking via the API or UI
6. You should receive a push notification on your device

### 3. Testing from Tinker

```php
php artisan tinker

use App\Services\PushNotificationService;

$service = new PushNotificationService();

$service->sendToAll([
    'title' => 'Test Notification',
    'body' => 'This is a test push notification',
    'icon' => '/icon-192x192.png',
]);
```

## Notification Payload Format

The service worker expects the following payload structure:

```json
{
  "title": "Notification Title",
  "body": "Notification message",
  "icon": "/icon-192x192.png",
  "badge": "/icon-144x144.png",
  "tag": "notification-tag",
  "requireInteraction": false,
  "data": {
    "url": "/vehicle-bookings",
    "booking_id": 123
  }
}
```

**Field Descriptions:**
- `title` (required): Notification title
- `body` (required): Notification message
- `icon` (optional): Large icon shown in notification
- `badge` (optional): Small icon shown in status bar
- `tag` (optional): Unique identifier to replace/update notifications
- `requireInteraction` (optional): Keep notification visible until user interacts
- `data` (optional): Custom data passed to click handler
  - `url`: Path to navigate when notification is clicked

## Routes Setup

Add these routes to your `routes/api.php`:

```php
use App\Http\Controllers\Api\PushSubscriptionController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store']);
    Route::delete('/push-subscriptions', [PushSubscriptionController::class, 'destroy']);
});
```

## Security Considerations

1. **Authentication Required:** All subscription endpoints require authentication
2. **User Association:** Subscriptions are tied to user accounts
3. **VAPID Keys:** Keep private key secure and never expose it to the frontend
4. **Endpoint Validation:** Validate subscription endpoints before storing
5. **Cleanup:** Remove expired/invalid subscriptions automatically

## Browser Support

Push notifications are supported in:
- Chrome/Edge (Desktop & Android)
- Firefox (Desktop & Android)
- Safari (Desktop & iOS 16.4+)
- Opera (Desktop & Android)

## Troubleshooting

### Issue: Notifications not received

**Check:**
1. VAPID keys are correctly configured
2. Subscription is stored in database
3. Browser has notification permission granted
4. Service worker is registered (check DevTools > Application > Service Workers)
5. Backend is sending correct payload format

### Issue: Subscription fails

**Check:**
1. HTTPS is enabled (required for service workers)
2. Service worker is properly registered
3. VAPID public key matches between frontend and backend

### Issue: Notification permission denied

**Solution:**
User must manually reset permission in browser settings and try again.

## Next Steps

1. Generate and configure VAPID keys
2. Run the migration to create the `push_subscriptions` table
3. Implement the API endpoints in Laravel
4. Install and configure the `minishlink/web-push` package
5. Update vehicle booking creation to trigger notifications
6. Test the complete flow

## Additional Resources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [minishlink/web-push Documentation](https://github.com/web-push-libs/web-push-php)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
