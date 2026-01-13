# Fish Purchase Bill - Complete Implementation Guide

> **CRITICAL RULES - READ BEFORE IMPLEMENTING:**
> - ✅ Copy TypeScript types from erp-web to keep web and mobile in sync
> - ✅ One-shot implementation: Routes → Backend → Frontend → Translations → Testing
> - ✅ Reuse ALL business logic via API (Jobs/Services/Events)
> - ✅ Think and reiterate - NO MISTAKES ALLOWED
> - ✅ Test each component before moving to next

---

## Phase 0: Pre-Implementation Checklist

### 1. Copy Types from Web App
**Source:** `/Users/afzal/Code/Web/finserp/erp-web/resources/js/types/index.d.ts`
**Destination:** `/Users/afzal/Code/Web/finserp/erp-mobile/src/types/fish-purchase.ts`

**Types to Copy:**
- `FishPurchase`
- `FishPurchaseItem`
- `FishSpecies`
- `Contact` (supplier types)
- `Address` (location types)
- `Bank`

**Action:** Direct copy + adapt to mobile needs (remove Inertia-specific types)

### 2. Backend Routes Strategy
**Location:** `erp-web/routes/api.php`

```php
// Add these routes
Route::middleware(['auth:sanctum'])->prefix('fish-purchases')->group(function () {
    Route::get('/', [FishPurchaseApiController::class, 'index']);
    Route::post('/', [FishPurchaseApiController::class, 'store']);
    Route::get('/{id}', [FishPurchaseApiController::class, 'show']);
    Route::put('/{id}', [FishPurchaseApiController::class, 'update']);
    Route::delete('/{id}', [FishPurchaseApiController::class, 'destroy']);

    // Helper endpoints
    Route::get('/fish-species/list', [FishPurchaseApiController::class, 'fishSpecies']);
    Route::get('/settings/defaults', [FishPurchaseApiController::class, 'settings']);
});
```

### 3. Backend Controller - Zero Duplication
**Location:** `erp-web/modules/fmsaas/src/Http/Controllers/Api/FishPurchaseApiController.php`

**Strategy:**
```php
// REUSE EXISTING:
- CreateFishPurchaseRequest (validation)
- CreateFishPurchase Job (business logic)
- FishPurchaseResource (response format)
- FishPurchaseService (queries)
- ALL Events/Listeners (bill creation, accounting)

// ONLY ADD:
- JSON response format
- Pagination for mobile
```

---

## Implementation Checklist (Follow Order!)

### ✅ STEP 1: Backend API Setup (2-3 hours)

#### 1.1 Create API Controller
- [ ] Create `modules/fmsaas/src/Http/Controllers/Api/FishPurchaseApiController.php`
- [ ] Import and reuse existing Jobs: `CreateFishPurchase`, `UpdateFishPurchase`, `DeleteFishPurchase`
- [ ] Import and reuse existing FormRequests: `CreateFishPurchaseRequest`, `UpdateFishPurchaseRequest`
- [ ] Import and reuse existing Resource: `FishPurchaseResource`
- [ ] Implement `index()` - list with filters
- [ ] Implement `store()` - create (calls CreateFishPurchase Job)
- [ ] Implement `show()` - single item
- [ ] Implement `update()` - update (calls UpdateFishPurchase Job)
- [ ] Implement `destroy()` - delete (calls DeleteFishPurchase Job)
- [ ] Implement `fishSpecies()` - get species list
- [ ] Implement `settings()` - get defaults

#### 1.2 Add API Routes
- [ ] Add routes to `routes/api.php`
- [ ] Test with Postman/Thunder Client
- [ ] Verify auth (Sanctum) works
- [ ] Verify CORS allows mobile domain

#### 1.3 Test Backend
- [ ] Create fish purchase via API
- [ ] Verify bill auto-creation (event listener)
- [ ] Verify accounting entries
- [ ] Check permissions enforcement
- [ ] Test validation errors

---

### ✅ STEP 2: Mobile Types Setup (1 hour)

#### 2.1 Copy Types from Web App
- [ ] Read `erp-web/resources/js/types/index.d.ts`
- [ ] Create `erp-mobile/src/types/fish-purchase.ts`
- [ ] Copy interfaces: `FishPurchase`, `FishPurchaseItem`, `FishSpecies`
- [ ] Adapt types (remove Inertia-specific, add mobile-specific)
- [ ] Add request/response types

**Example:**
```typescript
// erp-mobile/src/types/fish-purchase.ts
export interface FishPurchase {
  id: number;
  bill_id?: number;
  contact_id?: number;
  contact_name: string;
  contact_number: string;
  bank_id?: number;
  account_number?: string;
  bill_number: string;
  vehicle_number: string;
  driver_name: string;
  driver_number?: string;
  fish_location_id: number;
  date: string;
  vehicle_time_in?: string;
  vehicle_time_out?: string;
  loading_time_in?: string;
  loading_time_out?: string;
  status: FishPurchaseStatus;
  remarks?: string;
  total_boxes: number;
  total_weight: number;
  total_amount: number;
  balance_amount: number;
  items?: FishPurchaseItem[];
  supplier?: Contact;
  location?: Address;
  bill?: BillDocument;
  created_at: string;
  date_formatted: string;
}

export interface FishPurchaseItem {
  id: number;
  fish_purchase_id?: number;
  fish_species_id: number;
  box_count: number;
  box_weights: number[];
  average_box_weight: number;
  net_weight: number;
  rate: number;
  net_amount: number;
  fish_count?: string;
  remarks?: string;
  fish_species?: FishSpecies;
}

export interface FishSpecies {
  id: number;
  name: string;
  name_ar?: string;
  code?: string;
}

export type FishPurchaseStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'closed' | 'reject';

export interface CreateFishPurchaseRequest {
  contact_id?: number;
  contact_name: string;
  contact_number: string;
  bank_id?: number;
  account_number?: string;
  fish_location_id: number;
  bill_number: string;
  vehicle_number: string;
  driver_name: string;
  driver_number?: string;
  date?: string;
  vehicle_time_in?: string;
  vehicle_time_out?: string;
  loading_time_in?: string;
  loading_time_out?: string;
  remarks?: string;
  items: Omit<FishPurchaseItem, 'id' | 'fish_purchase_id' | 'average_box_weight' | 'net_weight' | 'net_amount'>[];
}
```

#### 2.2 Update API Types
- [ ] Update `src/types/vehicle-booking.ts` to add `fish_purchase_id?: number`
- [ ] This links bookings to purchases

---

### ✅ STEP 3: Mobile API Service (1-2 hours)

#### 3.1 Create Service Layer
- [ ] Create `src/lib/services/fish-purchase.ts`
- [ ] Implement all CRUD methods
- [ ] Add error handling
- [ ] Add TypeScript strict typing

```typescript
// src/lib/services/fish-purchase.ts
import { api } from "@/lib/api";
import type {
  FishPurchase,
  FishPurchaseItem,
  FishSpecies,
  CreateFishPurchaseRequest,
  UpdateFishPurchaseRequest,
  PaginatedResponse,
  ApiResponse,
} from "@/types/fish-purchase";

class FishPurchaseService {
  async getFishPurchases(filters?: {
    search?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<FishPurchase>> {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.status) params.append("status", filters.status);
    // ... add all filters

    const response = await api.get<PaginatedResponse<FishPurchase>>(
      `/fish-purchases?${params.toString()}`
    );
    return response.data;
  }

  async getFishPurchase(id: number): Promise<FishPurchase> {
    const response = await api.get<ApiResponse<FishPurchase>>(`/fish-purchases/${id}`);
    return response.data.data!;
  }

  async createFishPurchase(data: CreateFishPurchaseRequest): Promise<FishPurchase> {
    const response = await api.post<ApiResponse<FishPurchase>>(`/fish-purchases`, data);
    return response.data.data!;
  }

  async updateFishPurchase(id: number, data: UpdateFishPurchaseRequest): Promise<FishPurchase> {
    const response = await api.put<ApiResponse<FishPurchase>>(`/fish-purchases/${id}`, data);
    return response.data.data!;
  }

  async deleteFishPurchase(id: number): Promise<void> {
    await api.delete(`/fish-purchases/${id}`);
  }

  async getFishSpecies(): Promise<FishSpecies[]> {
    const response = await api.get<ApiResponse<FishSpecies[]>>(`/fish-purchases/fish-species/list`);
    return response.data.data!;
  }

  async getSettings(): Promise<any> {
    const response = await api.get(`/fish-purchases/settings/defaults`);
    return response.data.data;
  }
}

export const fishPurchaseService = new FishPurchaseService();
```

#### 3.2 Create React Hooks
- [ ] Create `src/lib/hooks/use-fish-purchases.ts`
- [ ] Create `src/lib/hooks/use-fish-species.ts`
- [ ] Create `src/lib/hooks/use-suppliers.ts`

---

### ✅ STEP 4: Translations (30 min)

#### 4.1 Add English Translations
- [ ] Edit `messages/en.json`
- [ ] Add complete fish purchase translations

```json
{
  "fishPurchases": {
    "title": "Fish Purchases",
    "createNew": "Create Fish Purchase",
    "billNumber": "Bill Number",
    "supplier": "Supplier",
    "vehicle": "Vehicle Number",
    "driver": "Driver Name",
    "location": "Location",
    "date": "Date",
    "totalBoxes": "Total Boxes",
    "totalWeight": "Total Weight",
    "totalAmount": "Total Amount",
    "status": {
      "draft": "Draft",
      "pending": "Pending",
      "approved": "Approved",
      "paid": "Paid"
    },
    "items": {
      "title": "Fish Items",
      "addItem": "Add Fish Item",
      "species": "Fish Species",
      "boxCount": "Box Count",
      "boxWeights": "Box Weights",
      "rate": "Rate (OMR/kg)",
      "netWeight": "Net Weight",
      "amount": "Amount"
    },
    "steps": {
      "supplier": "Supplier",
      "details": "Details",
      "items": "Fish Items",
      "review": "Review"
    }
  }
}
```

#### 4.2 Add Arabic Translations
- [ ] Edit `messages/ar.json`
- [ ] Add complete Arabic translations (RTL ready)

---

### ✅ STEP 5: UI Components (4-5 hours)

#### 5.1 Supplier Selector Component
- [ ] Create `src/components/fish-purchase/supplier-selector.tsx`
- [ ] Search existing suppliers
- [ ] Manual entry mode
- [ ] Display bank details
- [ ] Auto-fill on selection

#### 5.2 Fish Item Card Component
- [ ] Create `src/components/fish-purchase/fish-item-card.tsx`
- [ ] Species dropdown
- [ ] Box count input
- [ ] Box weights input (dynamic array)
- [ ] Rate input
- [ ] Auto-calculate weight & amount
- [ ] Collapsible for mobile
- [ ] Delete button

#### 5.3 Fish Item List Component
- [ ] Create `src/components/fish-purchase/fish-item-list.tsx`
- [ ] Render multiple fish items
- [ ] Add new item button
- [ ] Totals summary card
- [ ] Empty state

#### 5.4 Purchase Details Form
- [ ] Create `src/components/fish-purchase/purchase-details-form.tsx`
- [ ] Bill number (auto-generated, readonly)
- [ ] Date picker
- [ ] Vehicle number input
- [ ] Driver name input
- [ ] Location selector
- [ ] Optional fields (agent, times)

#### 5.5 Progress Steps Component
- [ ] Create `src/components/fish-purchase/progress-steps.tsx`
- [ ] 4 steps: Supplier → Details → Items → Review
- [ ] Current step highlight
- [ ] Completed step checkmarks
- [ ] Mobile-optimized

---

### ✅ STEP 6: Main Pages (5-6 hours)

#### 6.1 List Page
- [ ] Create `src/app/[locale]/fish-purchases/page.tsx`
- [ ] List all fish purchases
- [ ] Search & filters
- [ ] Status tabs
- [ ] Pagination
- [ ] Pull-to-refresh
- [ ] Loading states
- [ ] Empty states

#### 6.2 Create Page (Multi-step Form)
- [ ] Create `src/app/[locale]/fish-purchases/new/page.tsx`
- [ ] Step 1: Supplier selector
- [ ] Step 2: Purchase details
- [ ] Step 3: Fish items management
- [ ] Step 4: Review & submit
- [ ] Navigation between steps
- [ ] Form persistence (localStorage)
- [ ] Submit handler
- [ ] Error handling
- [ ] Success redirect

#### 6.3 Details Page
- [ ] Create `src/app/[locale]/fish-purchases/[id]/page.tsx`
- [ ] Display full purchase info
- [ ] Supplier card
- [ ] Items table/cards
- [ ] Totals summary
- [ ] Status badge
- [ ] Actions (Edit, Delete, Approve)
- [ ] Share button
- [ ] Print/PDF option

---

### ✅ STEP 7: Vehicle Booking Integration (2-3 hours)

#### 7.1 Update Booking Card
- [ ] Edit `src/components/vehicle-booking/booking-card.tsx`
- [ ] Add "Create Fish Purchase" button
- [ ] Show when status is "offloaded" or "received"
- [ ] Pass vehicle context to creation page

#### 7.2 Update Complete Offloading Sheet
- [ ] Edit `src/components/vehicle-booking/complete-offloading-sheet.tsx`
- [ ] Add checkbox: "Create fish purchase bill?"
- [ ] Redirect to creation page after offload completion
- [ ] Pre-fill vehicle data

#### 7.3 Booking Details Drawer
- [ ] Edit `src/components/vehicle-booking/booking-details-drawer.tsx`
- [ ] Show linked fish purchase (if exists)
- [ ] Quick link to purchase details
- [ ] Display purchase status

---

### ✅ STEP 8: Validation & Business Logic (2 hours)

#### 8.1 Client-side Validation
- [ ] Create `src/lib/validation/fish-purchase.ts`
- [ ] Zod schemas for all forms
- [ ] Match backend validation rules
- [ ] Custom error messages

#### 8.2 Auto-calculations
- [ ] Average box weight = sum(box_weights) / box_count
- [ ] Net weight = box_count × average_box_weight
- [ ] Net amount = net_weight × rate
- [ ] Total calculations across items

#### 8.3 Form State Management
- [ ] Use react-hook-form
- [ ] Default values
- [ ] Field validation
- [ ] Dirty state tracking
- [ ] Reset functionality

---

### ✅ STEP 9: Testing & Polish (3-4 hours)

#### 9.1 Manual Testing Checklist
- [ ] Create fish purchase from scratch
- [ ] Create fish purchase from vehicle booking
- [ ] Edit draft purchase
- [ ] Delete draft purchase
- [ ] Search & filter purchases
- [ ] View purchase details
- [ ] Test offline behavior
- [ ] Test on different screen sizes
- [ ] Test RTL (Arabic) layout
- [ ] Test all validation errors

#### 9.2 Edge Cases
- [ ] Handle API errors gracefully
- [ ] Handle network timeouts
- [ ] Handle unauthorized access
- [ ] Handle duplicate bill numbers
- [ ] Handle invalid data

#### 9.3 Performance
- [ ] Lazy load components
- [ ] Optimize re-renders
- [ ] Debounce search inputs
- [ ] Cache fish species list
- [ ] Optimize images

#### 9.4 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Focus management
- [ ] Error announcements
- [ ] Touch target sizes (min 44px)

---

## Critical Implementation Notes

### 🚨 DO NOT DUPLICATE BUSINESS LOGIC
```typescript
// ❌ WRONG - Don't do this in mobile app
async createFishPurchase(data) {
  // Create purchase
  const purchase = await db.insert(data);

  // Create bill (WRONG!)
  const bill = await db.bills.create({...});

  // Create accounting entries (WRONG!)
  await db.transactions.create({...});

  return purchase;
}

// ✅ CORRECT - Just call backend
async createFishPurchase(data: CreateFishPurchaseRequest) {
  // Backend handles EVERYTHING via Jobs/Events
  return api.post('/fish-purchases', data);
}
```

### 🎯 Type Sync Strategy
```bash
# Before implementation, copy types
cd /Users/afzal/Code/Web/finserp/erp-web
cat resources/js/types/index.d.ts | grep -A 50 "interface FishPurchase"

# Copy output to erp-mobile/src/types/fish-purchase.ts
```

### 🔄 Data Flow
```
Mobile UI
  → API Service Layer (TypeScript)
    → HTTP Request (JSON)
      → Laravel API Controller
        → Form Request (Validation)
          → Job (CreateFishPurchase)
            → Model + Events
              → Listeners (Bill creation, Accounting)
                → Response (FishPurchaseResource)
            ← JSON Response
          ← Mobile UI Updated
```

---

## File Creation Order (Follow Exactly!)

```
1. Backend (erp-web):
   ✓ modules/fmsaas/src/Http/Controllers/Api/FishPurchaseApiController.php
   ✓ routes/api.php (add routes)
   ✓ Test with Postman

2. Mobile Types (erp-mobile):
   ✓ src/types/fish-purchase.ts (copy from web)

3. Mobile Services:
   ✓ src/lib/services/fish-purchase.ts
   ✓ src/lib/hooks/use-fish-purchases.ts
   ✓ src/lib/hooks/use-fish-species.ts

4. Mobile Validation:
   ✓ src/lib/validation/fish-purchase.ts

5. Mobile Components (bottom-up):
   ✓ src/components/fish-purchase/supplier-selector.tsx
   ✓ src/components/fish-purchase/fish-item-card.tsx
   ✓ src/components/fish-purchase/fish-item-list.tsx
   ✓ src/components/fish-purchase/purchase-details-form.tsx
   ✓ src/components/fish-purchase/progress-steps.tsx
   ✓ src/components/fish-purchase/purchase-summary.tsx

6. Mobile Pages (top-down):
   ✓ src/app/[locale]/fish-purchases/new/page.tsx
   ✓ src/app/[locale]/fish-purchases/page.tsx
   ✓ src/app/[locale]/fish-purchases/[id]/page.tsx

7. Integration:
   ✓ Update vehicle-booking components
   ✓ Add navigation links
   ✓ Update vehicle booking types

8. Translations:
   ✓ messages/en.json
   ✓ messages/ar.json

9. Testing:
   ✓ Manual E2E test
   ✓ Fix bugs
   ✓ Performance check
```

---

## Success Criteria (ALL Must Pass!)

- [ ] Can create fish purchase from mobile
- [ ] Bill auto-created on backend (verify in web app)
- [ ] Accounting entries created automatically
- [ ] Can create purchase from vehicle booking (pre-filled)
- [ ] All calculations accurate (weight, amount)
- [ ] Validation works (client + server)
- [ ] Search & filters work
- [ ] Offline support (basic)
- [ ] Works on iOS & Android browsers
- [ ] RTL (Arabic) layout correct
- [ ] No console errors
- [ ] Fast loading (<2s)
- [ ] Types match between web & mobile

---

## Remember During Implementation

1. **COPY types from web app** - don't recreate
2. **REUSE backend Jobs** - don't duplicate logic
3. **TEST each component** before moving to next
4. **Follow file creation order** - bottom-up then top-down
5. **Complete translations** for both EN/AR
6. **Think before coding** - plan each function
7. **One-shot implementation** - no half-done features

---

**READY TO IMPLEMENT? Follow this guide step-by-step, checking off each item!**
