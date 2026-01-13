# Fish Purchase Bill Feature - Mobile App Implementation Plan

## Overview
Based on analysis of the web app's fish purchase feature, I'll create a streamlined mobile flow that integrates seamlessly with the existing vehicle booking system. The mobile app will focus on quick data entry optimized for on-site use.

---

## Implementation Strategy

### **Integration Point: Vehicle Booking → Fish Purchase Bill**
The mobile app already has vehicle booking with offloading statuses. We'll add a "Create Fish Purchase Bill" action that can be triggered when a vehicle is in "offloaded" status.

---

## Phase 1: Backend API Integration (TypeScript Types & Services)

### 1.1 Create Type Definitions
**File:** `src/types/fish-purchase.ts`
- Define FishPurchase, FishPurchaseItem interfaces
- Fish species, supplier, location types
- Request/response types matching Laravel API structure

### 1.2 Create API Service Layer
**File:** `src/lib/services/fish-purchase.ts`
- `createFishPurchase()` - POST to `/api/fish-purchases`
- `getFishPurchases()` - GET with filters
- `getFishPurchase(id)` - GET single purchase
- `updateFishPurchase(id)` - PUT to update
- `deleteFishPurchase(id)` - DELETE draft purchase
- `getFishSpecies()` - GET available fish species
- `getSuppliers()` - GET fish suppliers with bank details
- `getLocations()` - GET fish landing sites

### 1.3 Create Data Fetching Hooks
**Files:**
- `src/lib/hooks/use-fish-purchases.ts`
- `src/lib/hooks/use-fish-species.ts`
- `src/lib/hooks/use-suppliers.ts`

---

## Phase 2: UI Components

### 2.1 Core Form Components
**Directory:** `src/components/fish-purchase/`

#### Components to Build:
1. **`supplier-selector.tsx`**
   - SearchableSelect for existing suppliers
   - Quick "manual entry" mode for new suppliers
   - Display: name, phone, bank account

2. **`fish-item-card.tsx`**
   - Species dropdown
   - Box count input
   - Box weight entry (array input or average)
   - Rate per kg input
   - Auto-calculated net weight & amount display
   - Fish count (optional)
   - Remarks textarea

3. **`fish-item-list.tsx`**
   - Manage multiple fish items
   - Add/remove items
   - Collapsible cards for mobile optimization
   - Summary totals card (boxes, weight, amount)

4. **`purchase-details-form.tsx`**
   - Bill number (auto-generated)
   - Date picker
   - Vehicle info (pre-filled from booking)
   - Driver info (pre-filled from booking)
   - Location selector
   - Agent selector (optional)
   - Time tracking (vehicle in/out, loading times)

---

## Phase 3: Main Pages/Screens

### 3.1 Create Fish Purchase Page (Multi-step Form)
**File:** `src/app/[locale]/fish-purchases/new/page.tsx`

**Flow (Optimized for Mobile):**
```
Step 1: Supplier Selection
├── Search existing supplier
└── Or enter manually (name, phone, bank, account)

Step 2: Purchase Details
├── Bill number (auto)
├── Vehicle & Driver (pre-filled if from booking)
├── Location
├── Date
└── Optional: Agent, Times

Step 3: Fish Items
├── Add fish items (species, boxes, weights, rate)
├── Dynamic addition/removal
└── See running totals

Step 4: Review & Submit
├── Summary of all data
├── Edit shortcuts
└── Submit button
```

**Mobile UX Optimizations:**
- Sticky bottom action buttons
- Swipeable steps or accordion
- Auto-save to local storage
- Haptic feedback on actions
- Large touch targets

### 3.2 Fish Purchase List Page
**File:** `src/app/[locale]/fish-purchases/page.tsx`
- List all fish purchases
- Filter by status, date, supplier
- Search by bill number, vehicle number
- Status badges (pending, approved, paid)
- Tap to view details

### 3.3 Fish Purchase Details Page
**File:** `src/app/[locale]/fish-purchases/[id]/page.tsx`
- View full purchase details
- Supplier info
- All fish items in table/cards
- Totals and summary
- Status and payment info
- Actions: Edit (if pending), Approve, Delete

---

## Phase 4: Integration with Vehicle Booking

### 4.1 Add "Create Bill" Button to Booking Card
**File:** `src/components/vehicle-booking/booking-card.tsx`
- Add button when status is "offloaded" or "received"
- Pre-fill vehicle number, driver info
- Redirect to fish purchase creation with context

### 4.2 Link Purchases to Bookings
- Add `fish_purchase_id` reference in vehicle booking
- Show linked purchase in booking details
- Quick navigation between booking ↔ purchase

### 4.3 Update Complete Offloading Flow
**File:** `src/components/vehicle-booking/complete-offloading-sheet.tsx`
- Add option: "Create fish purchase bill now?"
- After completing offload, prompt user to create bill
- Direct flow optimization

---

## Phase 5: Additional Features

### 5.1 Quick Entry Mode
**File:** `src/app/[locale]/fish-purchases/quick/page.tsx`
- Single-page form (no steps)
- For experienced users
- All fields visible with smart defaults

### 5.2 Offline Support
- Cache fish species, suppliers, locations
- Store draft purchases in IndexedDB
- Auto-sync when online
- Conflict resolution

### 5.3 Camera Integration
- Take photos of fish/documents
- Attach to fish purchase items
- Auto-upload with compression

---

## Phase 6: Data Validation & Business Logic

### 6.1 Form Validation (Zod Schemas)
**File:** `src/lib/validation/fish-purchase.ts`
- Supplier validation
- Items validation (min 1 item, required fields)
- Weight calculation checks
- Bill number uniqueness

### 6.2 Auto-calculations
- Net weight = box_count × average_box_weight
- Net amount = net_weight × rate
- Total boxes, weight, amount across all items

### 6.3 Smart Defaults
- Current date
- Last used supplier (cached)
- Last used location
- Default box weight from settings

---

## File Structure Summary

```
erp-mobile/
├── src/
│   ├── types/
│   │   └── fish-purchase.ts (new)
│   ├── lib/
│   │   ├── services/
│   │   │   └── fish-purchase.ts (new)
│   │   ├── hooks/
│   │   │   ├── use-fish-purchases.ts (new)
│   │   │   ├── use-fish-species.ts (new)
│   │   │   └── use-suppliers.ts (new)
│   │   └── validation/
│   │       └── fish-purchase.ts (new)
│   ├── components/
│   │   └── fish-purchase/ (new directory)
│   │       ├── supplier-selector.tsx
│   │       ├── fish-item-card.tsx
│   │       ├── fish-item-list.tsx
│   │       ├── purchase-details-form.tsx
│   │       ├── purchase-summary.tsx
│   │       └── progress-steps.tsx
│   └── app/
│       └── [locale]/
│           └── fish-purchases/ (new directory)
│               ├── page.tsx (list view)
│               ├── new/
│               │   └── page.tsx (create form)
│               ├── [id]/
│               │   └── page.tsx (details view)
│               └── quick/
│                   └── page.tsx (quick entry)
```

---

## Development Phases & Estimates

### Phase 1: Foundation (Types & Services) - **2-3 hours**
- Create TypeScript types
- Build API service layer
- Create data fetching hooks

### Phase 2: Core Components - **4-5 hours**
- Supplier selector
- Fish item card & list
- Purchase details form
- Shared UI components

### Phase 3: Main Pages - **5-6 hours**
- Multi-step creation form
- List/index page
- Details page
- Validation & error handling

### Phase 4: Vehicle Booking Integration - **2-3 hours**
- Add "Create Bill" action
- Pre-fill from booking context
- Update offloading flow

### Phase 5: Polish & Testing - **3-4 hours**
- Offline support basics
- Loading states & animations
- Error boundaries
- E2E testing
- Mobile responsiveness

**Total Estimate: 16-21 hours**

---

## Key Design Decisions

### 1. **Mobile-First Approach**
- Single column layouts
- Bottom sheet dialogs
- Touch-optimized inputs
- Swipe gestures

### 2. **Progressive Enhancement**
- Start with basic create/view
- Add offline support later
- Camera integration as enhancement

### 3. **Leverage Existing Patterns**
- Reuse vehicle booking UI patterns
- Match existing design system
- Consistent navigation

### 4. **Performance Optimizations**
- Virtual scrolling for fish items (if many)
- Debounced search
- Optimistic updates
- Smart caching

---

## API Endpoints Required

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/fish-purchases` | List purchases |
| POST | `/api/fish-purchases` | Create purchase |
| GET | `/api/fish-purchases/{id}` | Get single purchase |
| PUT | `/api/fish-purchases/{id}` | Update purchase |
| DELETE | `/api/fish-purchases/{id}` | Delete draft |
| GET | `/api/fish-species` | Get species list |
| GET | `/api/contacts?type=fish_supplier` | Get suppliers |
| GET | `/api/addresses?type=fish_landing_site` | Get locations |

---

## Success Criteria

✅ User can create fish purchase bills from mobile
✅ Seamless integration with vehicle bookings
✅ Auto-calculations work correctly
✅ Form validation prevents errors
✅ Offline-capable (basic support)
✅ Fast load times (<2s)
✅ Intuitive mobile UX
✅ Matches web app data structure

---

## Next Steps After Approval

1. Create TypeScript types based on Laravel models
2. Build API service layer with proper error handling
3. Implement supplier selector component
4. Build fish item management UI
5. Create multi-step form page
6. Integrate with vehicle booking flow
7. Add offline support & caching
8. Test end-to-end flow
9. Deploy & monitor

---

**Ready to proceed with implementation?** This plan provides a complete roadmap for adding fish purchase bill functionality to the mobile app while maintaining consistency with the web app and optimizing for mobile use cases.
