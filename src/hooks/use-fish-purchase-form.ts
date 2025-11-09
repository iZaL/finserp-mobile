import { useState, useEffect, useMemo, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { fishPurchaseFormSchema, type FishPurchaseFormData } from "@/lib/validation/fish-purchase"
import { fishPurchaseService } from "@/lib/services/fish-purchase"
import { useFishPurchaseFormData } from "./use-fish-purchase-data"
import { fishPurchaseKeys } from "@/lib/query-keys"
import type { FishPurchaseFormStep } from "@/types/fish-purchase"
import type { Address, Contact } from "@/types/shared"
import { toast } from "sonner"

interface UseFishPurchaseFormState {
  activeStep: FishPurchaseFormStep
  locations: Address[]
  loadingVehicleData: boolean
}

const initialState: UseFishPurchaseFormState = {
  activeStep: "supplier",
  locations: [],
  loadingVehicleData: false,
}

interface UseFishPurchaseFormOptions {
  vehicleBookingId?: string | null
  searchParams?: URLSearchParams | null
}

/**
 * Shared hook for fish purchase form logic (create and edit)
 * Consolidates state management and reduces code duplication
 */
export function useFishPurchaseForm(options: UseFishPurchaseFormOptions = {}) {
  const { vehicleBookingId, searchParams } = options

  // Consolidated state using object
  const [state, setState] = useState<UseFishPurchaseFormState>(initialState)

  // Helper to update state (prevents unnecessary re-renders)
  const updateState = useCallback(
    <K extends keyof UseFishPurchaseFormState>(
      key: K,
      value: UseFishPurchaseFormState[K]
    ) => {
      setState((prev) => {
        if (prev[key] === value) return prev
        return { ...prev, [key]: value }
      })
    },
    []
  )

  // Initialize form with React Hook Form
  const form = useForm<FishPurchaseFormData>({
    resolver: zodResolver(fishPurchaseFormSchema),
    defaultValues: useMemo(
      () => ({
        contact_id: searchParams?.get("supplier_id")
          ? parseInt(searchParams.get("supplier_id")!)
          : undefined,
        contact_name: searchParams?.get("supplier_name") || "",
        contact_number: searchParams?.get("supplier_phone") || "",
        bank_id: undefined,
        account_number: "",
        bill_number: "",
        vehicle_number: searchParams?.get("vehicle") || "",
        driver_name: searchParams?.get("driver") || "",
        driver_number: searchParams?.get("driver_phone") || "",
        fish_location_id: 0,
        date: new Date().toISOString().split("T")[0],
        items: [
          {
            id: 1,
            fish_species_id: 0,
            box_count: 0,
            box_weights: [0],
            rate: 0,
            fish_count: "",
            remarks: "",
          },
        ],
      }),
      [searchParams]
    ),
  })

  const { watch, setValue, getValues, formState, trigger } = form
  const formData = watch()
  const selectedSupplierId = formData.contact_id

  const {
    fishSpecies,
    suppliers,
    locations: initialLocations,
    agents,
    settings,
    loading: dataLoading,
  } = useFishPurchaseFormData({
    selectedSupplierId,
  })

  // Helper to batch update multiple form fields at once
  const batchSetValue = useCallback(
    async (updates: Partial<FishPurchaseFormData>, options?: { shouldDirty?: boolean; shouldValidate?: boolean }) => {
      Object.entries(updates).forEach(([key, value]) => {
        // Convert null to undefined for non-string fields, keep strings as-is (Input component handles null)
        const safeValue = value === null ? undefined : value
        
        setValue(key as keyof FishPurchaseFormData, safeValue, {
          shouldDirty: options?.shouldDirty ?? true,
          shouldValidate: options?.shouldValidate ?? false,
        })
      })
      
      // Trigger validation for updated fields if requested
      if (options?.shouldValidate) {
        await trigger(Object.keys(updates) as Array<keyof FishPurchaseFormData>)
      }
    },
    [setValue, trigger]
  )

  // Initialize locations from hook - FIXED: Only update if locations actually changed
  useEffect(() => {
    if (initialLocations && initialLocations.length > 0) {
      setState((prev) => {
        // Only update if the arrays are different
        if (
          prev.locations.length !== initialLocations.length ||
          prev.locations.some((loc, idx) => loc.id !== initialLocations[idx]?.id)
        ) {
          return { ...prev, locations: initialLocations }
        }
        return prev
      })
    }
  }, [initialLocations])

  // Set bill number from settings - FIXED: Remove formData.bill_number from deps
  useEffect(() => {
    if (settings?.bill_number) {
      const currentBillNumber = getValues("bill_number")
      if (!currentBillNumber) {
        setValue("bill_number", settings.bill_number, { shouldDirty: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.bill_number])

  // Fetch and pre-populate data from vehicle booking - FIXED: Memoize and cleanup
  useEffect(() => {
    if (!vehicleBookingId) return

    let isMounted = true

    const fetchVehicleData = async () => {
      updateState("loadingVehicleData", true)
      try {
        const vehicleData = await fishPurchaseService.getVehicleBookingData(
          parseInt(vehicleBookingId)
        )

        if (!isMounted) return

        // Pre-populate form fields using batch update
        batchSetValue(
          {
            contact_name: vehicleData.supplier_name || "",
            contact_number: vehicleData.supplier_phone || "",
            vehicle_number: vehicleData.vehicle_number || "",
            driver_name: vehicleData.driver_name || "",
            driver_number: vehicleData.driver_phone || "",
            date: vehicleData.entry_date || "",
          },
          { shouldDirty: false }
        )

        // Set box count in first item if available
        if (vehicleData.box_count > 0) {
          setValue("items.0.box_count", vehicleData.box_count, { shouldDirty: false })
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch vehicle data:", error)
          toast.error("Failed to load vehicle booking data")
        }
      } finally {
        if (isMounted) {
          updateState("loadingVehicleData", false)
        }
      }
    }

    fetchVehicleData()

    return () => {
      isMounted = false
    }
  }, [vehicleBookingId, batchSetValue, setValue, updateState])

  // Pre-populate supplier bank details - FIXED: Better dependency handling
  useEffect(() => {
    const supplierId = searchParams?.get("supplier_id")
    if (supplierId && suppliers.length > 0) {
      const supplier = suppliers.find((s) => s.id === parseInt(supplierId))
      if (supplier) {
        batchSetValue(
          {
            bank_id: supplier.bank_account?.bank_id,
            account_number: supplier.bank_account?.account_number || "",
          },
          { shouldDirty: false }
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliers.length, searchParams?.get("supplier_id")])

  const queryClient = useQueryClient()

  // Handle supplier selection - Memoized with batch update (defined first to avoid circular dependency)
  const handleSelectSupplier = useCallback(
    async (supplier: Contact | null) => {
      if (!supplier) {
        await batchSetValue({ contact_id: undefined }, { shouldValidate: true })
        return
      }

      // Update form values and trigger validation to ensure Next button enables
      await batchSetValue(
        {
          contact_id: supplier.id,
          contact_name: supplier.name,
          contact_number: supplier.phone || "",
          bank_id: supplier.bank_account?.bank_id,
          account_number: supplier.bank_account?.account_number || "",
        },
        { shouldValidate: true }
      )
    },
    [batchSetValue]
  )

  // Handle adding new location - Memoized
  const handleAddLocation = useCallback(
    async (data: { name: string; city?: string }): Promise<Address> => {
      try {
        const newLocation = await fishPurchaseService.createLocation(data)
        setState((prev) => ({
          ...prev,
          locations: [...prev.locations, newLocation],
        }))
        toast.success("Location added successfully")
        return newLocation
      } catch (error) {
        console.error("Failed to add location:", error)
        toast.error("Failed to add location")
        throw error
      }
    },
    []
  )

  // Handle adding new supplier - Memoized (mimics location creation pattern exactly)
  const handleAddSupplier = useCallback(
    async (data: { name: string; phone: string }): Promise<Contact> => {
      try {
        const newSupplier = await fishPurchaseService.createSupplier(data)
        
        // Update the suppliers cache immediately (optimistic update)
        // This ensures the supplier is available in the suppliers array before selection
        queryClient.setQueryData<Contact[]>(fishPurchaseKeys.suppliers(), (oldData = []) => {
          // Check if supplier already exists (shouldn't, but just in case)
          const exists = oldData.some((s) => s.id === newSupplier.id)
          if (exists) {
            return oldData.map((s) => (s.id === newSupplier.id ? newSupplier : s))
          }
          return [...oldData, newSupplier]
        })
        
        toast.success("Supplier added successfully")
        
        // Note: We don't invalidate/refetch here to avoid race conditions with selection
        // The cache is already updated optimistically above, so the supplier is immediately available
        // The query will naturally refetch when it becomes stale or on next mount
        
        // Return the new supplier - the SupplierSelector will call onSelect with this
        // which will trigger handleSelectSupplier to update the form
        return newSupplier
      } catch (error) {
        console.error("Failed to add supplier:", error)
        toast.error("Failed to add supplier")
        throw error
      }
    },
    [queryClient]
  )

  // Navigation handlers - Memoized
  const handleNext = useCallback(() => {
    setState((prev) => {
      const steps: FishPurchaseFormStep[] = ["supplier", "details", "items", "review"]
      const currentIndex = steps.indexOf(prev.activeStep)
      if (currentIndex < steps.length - 1) {
        return { ...prev, activeStep: steps[currentIndex + 1] }
      }
      return prev
    })
  }, [])

  const handlePrevious = useCallback(() => {
    setState((prev) => {
      const steps: FishPurchaseFormStep[] = ["supplier", "details", "items", "review"]
      const currentIndex = steps.indexOf(prev.activeStep)
      if (currentIndex > 0) {
        return { ...prev, activeStep: steps[currentIndex - 1] }
      }
      return prev
    })
  }, [])

  const handleStepClick = useCallback((stepId: string) => {
    updateState("activeStep", stepId as FishPurchaseFormStep)
  }, [updateState])

  // Check if step is complete - Memoized
  const isStepComplete = useCallback(
    (stepId: string): boolean => {
      switch (stepId as FishPurchaseFormStep) {
        case "supplier":
          return Boolean(
            formData.contact_name &&
              formData.contact_name.length >= 2 &&
              formData.contact_number &&
              formData.contact_number.length >= 8
          )
        case "details":
          return Boolean(
            formData.bill_number &&
              formData.vehicle_number &&
              formData.driver_name &&
              formData.fish_location_id &&
              formData.fish_location_id > 0
          )
        case "items":
          return Boolean(
            formData.items &&
              formData.items.length > 0 &&
              formData.items.every(
                (item) =>
                  item.fish_species_id &&
                  item.rate &&
                  item.box_count &&
                  item.box_weights.length > 0
              )
          )
        default:
          return false
      }
    },
    [formData]
  )

  // Transform form data for API - Memoized
  const transformFormData = useCallback(
    (data: FishPurchaseFormData) => {
      return {
        ...data,
        ...(vehicleBookingId && { vehicle_booking_id: parseInt(vehicleBookingId) }),
        items: data.items.map((item) => ({
          ...(item.id && typeof item.id === "number" ? { id: item.id } : {}),
          fish_species_id: item.fish_species_id,
          box_count: item.box_count,
          box_weights: item.box_weights,
          rate: item.rate / 1000, // Convert BZ to OMR (1 OMR = 1000 BZ)
          fish_count: item.fish_count,
          remarks: item.remarks,
        })),
      }
    },
    [vehicleBookingId]
  )

  // Memoized error object transformation
  const errorMessages = useMemo(
    () =>
      Object.entries(formState.errors).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value?.message || String(value),
        }),
        {} as Record<string, string>
      ),
    [formState.errors]
  )

  return {
    // Form
    form,
    formData,
    getValues,
    setValue,
    batchSetValue, // Expose batch update helper
    errors: formState.errors,
    errorMessages,

    // State
    activeStep: state.activeStep,
    locations: state.locations,
    loadingVehicleData: state.loadingVehicleData,

    // Data
    fishSpecies,
    suppliers,
    agents,
    settings,
    dataLoading,

    // Handlers
    handleAddLocation,
    handleAddSupplier,
    handleSelectSupplier,
    handleNext,
    handlePrevious,
    handleStepClick,
    isStepComplete,
    transformFormData,

    // Utils
    updateState,
  }
}

