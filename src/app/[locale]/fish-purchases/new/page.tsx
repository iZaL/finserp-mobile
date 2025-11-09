"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  User,
  FileText,
  Package,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ProgressSteps } from "@/components/fish-purchase/progress-steps"
import { SupplierSelector } from "@/components/fish-purchase/supplier-selector"
import { PurchaseDetailsForm } from "@/components/fish-purchase/purchase-details-form"
import { FishItemList } from "@/components/fish-purchase/fish-item-list"
import { PurchaseSummary } from "@/components/fish-purchase/purchase-summary"
import { useFishPurchaseForm } from "@/hooks/use-fish-purchase-form"
import { useCreateFishPurchase } from "@/hooks/use-fish-purchases"

export default function CreateFishPurchasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("fishPurchases")
  const vehicleBookingId = searchParams?.get("vehicle_booking_id")

  const createMutation = useCreateFishPurchase()

  const {
    formData,
    getValues,
    setValue,
    errors,
    errorMessages,
    activeStep,
    locations,
    loadingVehicleData,
    fishSpecies,
    suppliers,
    agents,
    dataLoading,
    handleAddLocation,
    handleAddSupplier,
    handleSelectSupplier,
    handleNext,
    handlePrevious,
    handleStepClick,
    isStepComplete,
    transformFormData,
  } = useFishPurchaseForm({
    vehicleBookingId,
    searchParams,
  })

  // Memoized steps to prevent recreation
  const steps = useMemo(
    () => [
      { id: "supplier" as const, label: t("steps.supplier"), icon: User },
      { id: "details" as const, label: t("steps.details"), icon: FileText },
      { id: "items" as const, label: t("steps.items"), icon: Package },
      { id: "review" as const, label: t("steps.review"), icon: ClipboardCheck },
    ],
    [t]
  )

  // Submit handler
  const handleSubmit = async () => {
    try {
      const data = getValues()
      const requestData = transformFormData(data)
      const result = await createMutation.mutateAsync(requestData)

      toast.success(t("createSuccess"))
      router.push(`/fish-purchases/${result.id}`)
    } catch (error) {
      console.error("Failed to create fish purchase:", error)
      toast.error(t("createError"))
    }
  }

  if (dataLoading || loadingVehicleData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("createNew")}</h1>
          <p className="text-sm text-muted-foreground">{t("createDescription")}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <ProgressSteps
        steps={steps}
        activeStep={activeStep}
        isStepComplete={isStepComplete}
        onStepClick={handleStepClick}
      />

      {/* Step Content */}
      <div className="space-y-6 mt-6">
        {/* Supplier Step */}
        {activeStep === "supplier" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>
                  {t("supplier.select")} <span className="text-destructive">*</span>
                </Label>
                <SupplierSelector
                  suppliers={suppliers}
                  selectedSupplierId={formData.contact_id}
                  onSelect={handleSelectSupplier}
                  onAddSupplier={handleAddSupplier}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 py-2 font-semibold text-muted-foreground">
                    {t("supplier.orManual")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">
                    {t("supplier.name")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name || ""}
                    onChange={(e) => setValue("contact_name", e.target.value)}
                    placeholder={t("supplier.namePlaceholder")}
                  />
                  {errors.contact_name && (
                    <p className="text-xs text-destructive">{errors.contact_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_number">
                    {t("supplier.phone")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact_number"
                    value={formData.contact_number || ""}
                    onChange={(e) => setValue("contact_number", e.target.value)}
                    placeholder={t("supplier.phonePlaceholder")}
                  />
                  {errors.contact_number && (
                    <p className="text-xs text-destructive">{errors.contact_number.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Details Step */}
        {activeStep === "details" && (
          <PurchaseDetailsForm
            formData={formData}
            onChange={(data) => {
              Object.entries(data).forEach(([key, value]) => {
                setValue(key as keyof typeof formData, value)
              })
            }}
            locations={locations}
            agents={agents}
            errors={errorMessages}
            onAddLocation={handleAddLocation}
          />
        )}

        {/* Items Step */}
        {activeStep === "items" && (
          <FishItemList
            items={formData.items}
            fishSpecies={fishSpecies}
            onChange={(items) => setValue("items", items)}
            errors={{}}
          />
        )}

        {/* Review Step */}
        {activeStep === "review" && (
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-lg border space-y-3">
              <h3 className="font-semibold text-sm">{t("review.supplierInfo")}</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">{t("supplier.name")}:</dt>
                <dd className="font-medium">{formData.contact_name}</dd>
                <dt className="text-muted-foreground">{t("supplier.phone")}:</dt>
                <dd className="font-medium">{formData.contact_number}</dd>
              </dl>
            </div>

            <div className="p-4 bg-card rounded-lg border space-y-3">
              <h3 className="font-semibold text-sm">{t("review.purchaseDetails")}</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">{t("details.billNumber")}:</dt>
                <dd className="font-medium">{formData.bill_number}</dd>
                <dt className="text-muted-foreground">{t("details.vehicleNumber")}:</dt>
                <dd className="font-medium">{formData.vehicle_number}</dd>
                <dt className="text-muted-foreground">{t("details.driverName")}:</dt>
                <dd className="font-medium">{formData.driver_name}</dd>
              </dl>
            </div>

            <PurchaseSummary items={formData.items} showDetails={true} fishSpecies={fishSpecies} />
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50 shadow-lg">
        <div className="container max-w-4xl mx-auto flex justify-between items-center gap-2">
          {activeStep !== "supplier" ? (
            <Button variant="outline" onClick={handlePrevious} size="lg">
              <ChevronLeft className="size-4 mr-1" />
              {t("buttons.previous")}
            </Button>
          ) : (
            <div />
          )}

          {activeStep !== "review" ? (
            <Button
              onClick={handleNext}
              disabled={!isStepComplete(activeStep)}
              className="ml-auto"
              size="lg"
            >
              {t("buttons.next")}
              <ChevronRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="ml-auto"
              size="lg"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  {t("buttons.submitting")}
                </>
              ) : (
                <>
                  <Check className="size-4 mr-1" />
                  {t("buttons.submit")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
