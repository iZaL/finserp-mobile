"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  FileText,
  Package,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ProgressSteps } from "@/components/fish-purchase/progress-steps";
import { SupplierSelector } from "@/components/fish-purchase/supplier-selector";
import { PurchaseDetailsForm } from "@/components/fish-purchase/purchase-details-form";
import { FishItemList } from "@/components/fish-purchase/fish-item-list";
import { PurchaseSummary } from "@/components/fish-purchase/purchase-summary";
import { useFishPurchaseFormData } from "@/hooks/use-fish-purchase-data";
import { useFishPurchase, useUpdateFishPurchase } from "@/hooks/use-fish-purchases";
import { fishPurchaseFormSchema, type FishPurchaseFormData } from "@/lib/validation/fish-purchase";
import { fishPurchaseService } from "@/lib/services/fish-purchase";
import type { FishPurchaseFormStep } from "@/types/fish-purchase";
import type { Contact, Address } from "@/types/shared";

export default function EditFishPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("fishPurchases");

  // Load existing purchase data
  const { data: existingPurchase, loading: loadingPurchase } = useFishPurchase(parseInt(id));

  const {
    fishSpecies,
    suppliers,
    locations: initialLocations,
    banks,
    agents,
    settings,
    loading: dataLoading,
  } = useFishPurchaseFormData();

  const { updatePurchase, loading: submitting } = useUpdateFishPurchase();

  const [activeStep, setActiveStep] = useState<FishPurchaseFormStep>("supplier");
  const [locations, setLocations] = useState<Address[]>([]);

  // Initialize form with React Hook Form
  const {
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FishPurchaseFormData>({
    resolver: zodResolver(fishPurchaseFormSchema),
    defaultValues: {
      contact_id: undefined,
      contact_name: "",
      contact_number: "",
      bank_id: undefined,
      account_number: "",
      bill_number: "",
      vehicle_number: "",
      driver_name: "",
      driver_number: "",
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
    },
  });

  const formData = watch();

  // Initialize locations from hook
  useEffect(() => {
    if (initialLocations) {
      setLocations(initialLocations);
    }
  }, [initialLocations]);

  // Load existing purchase data into form
  useEffect(() => {
    if (existingPurchase && fishSpecies.length > 0) {
      setValue("contact_id", existingPurchase.contact_id);
      setValue("contact_name", existingPurchase.contact_name);
      setValue("contact_number", existingPurchase.contact_number);
      setValue("bank_id", existingPurchase.bank_id);
      setValue("account_number", existingPurchase.account_number || "");
      setValue("bill_number", existingPurchase.bill_number);
      setValue("vehicle_number", existingPurchase.vehicle_number);
      setValue("driver_name", existingPurchase.driver_name);
      setValue("driver_number", existingPurchase.driver_number || "");
      setValue("fish_location_id", existingPurchase.fish_location_id);
      setValue("date", existingPurchase.date);
      setValue("agent_id", existingPurchase.agent_id);

      // Convert items and OMR rate to BZ
      if (existingPurchase.items) {
        const convertedItems = existingPurchase.items.map((item) => ({
          id: item.id,
          fish_species_id: item.fish_species_id,
          box_count: item.box_count,
          box_weights: item.box_weights,
          rate: Math.round(item.rate * 1000), // Convert OMR to BZ
          fish_count: item.fish_count || "",
          remarks: item.remarks || "",
          average_box_weight: item.average_box_weight,
          net_weight: item.net_weight,
          net_amount: item.net_amount,
        }));
        setValue("items", convertedItems);
      }
    }
  }, [existingPurchase, fishSpecies, setValue]);

  // Handle adding new location
  const handleAddLocation = async (data: { name: string; city?: string }): Promise<Address> => {
    try {
      const newLocation = await fishPurchaseService.createLocation(data);
      setLocations(prev => [...prev, newLocation]);
      toast.success(t("details.addLocationDialog.success") || "Location added successfully");
      return newLocation;
    } catch (error) {
      console.error("Failed to add location:", error);
      toast.error(t("details.addLocationDialog.error") || "Failed to add location");
      throw error;
    }
  };

  // Progress steps
  const steps = [
    { id: "supplier" as const, label: t("steps.supplier"), icon: User },
    { id: "details" as const, label: t("steps.details"), icon: FileText },
    { id: "items" as const, label: t("steps.items"), icon: Package },
    { id: "review" as const, label: t("steps.review"), icon: ClipboardCheck },
  ];

  // Check if step is complete
  const isStepComplete = (stepId: FishPurchaseFormStep): boolean => {
    switch (stepId) {
      case "supplier":
        return Boolean(
          formData.contact_name &&
          formData.contact_name.length >= 2 &&
          formData.contact_number &&
          formData.contact_number.length >= 8
        );
      case "details":
        return Boolean(
          formData.bill_number &&
          formData.vehicle_number &&
          formData.driver_name &&
          formData.fish_location_id &&
          formData.fish_location_id > 0
        );
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
        );
      default:
        return false;
    }
  };

  // Handle supplier selection
  const handleSelectSupplier = (supplier: Contact | null) => {
    if (!supplier) {
      setValue("contact_id", undefined);
      return;
    }

    setValue("contact_id", supplier.id);
    setValue("contact_name", supplier.name);
    setValue("contact_number", supplier.phone || "");
    setValue("bank_id", supplier.bank_account?.bank_id);
    setValue("account_number", supplier.bank_account?.account_number || "");
  };

  // Navigation
  const handleNext = () => {
    const currentIndex = steps.findIndex((s) => s.id === activeStep);
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex((s) => s.id === activeStep);
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1].id);
    }
  };

  // Submit
  const handleSubmit = async () => {
    try {
      const data = getValues();

      // Transform items to match API request structure
      const requestData = {
        ...data,
        items: data.items.map((item) => ({
          ...(item.id && typeof item.id === 'number' ? { id: item.id } : {}), // Include id only if it's a number
          fish_species_id: item.fish_species_id,
          box_count: item.box_count,
          box_weights: item.box_weights,
          rate: item.rate / 1000, // Convert BZ to OMR (1 OMR = 1000 BZ)
          fish_count: item.fish_count,
          remarks: item.remarks,
        })),
      };

      const result = await updatePurchase(parseInt(id), requestData);

      toast.success(t("updateSuccess") || "Fish purchase updated successfully");
      router.push(`/fish-purchases/${result.id}`);
    } catch (error) {
      console.error("Failed to update fish purchase:", error);
      toast.error(t("updateError") || "Failed to update fish purchase");
    }
  };

  if (loadingPurchase || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!existingPurchase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground mb-4">{t("notFound")}</p>
        <Button onClick={() => router.push("/fish-purchases")}>
          {t("backToList")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("edit") || "Edit Fish Purchase"}</h1>
          <p className="text-sm text-muted-foreground">{existingPurchase.bill_number}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <ProgressSteps
        steps={steps}
        activeStep={activeStep}
        isStepComplete={isStepComplete}
        onStepClick={setActiveStep}
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
                    value={formData.contact_name}
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
                    value={formData.contact_number}
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
                setValue(key as any, value);
              });
            }}
            locations={locations}
            agents={agents}
            errors={errors as any}
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
              disabled={submitting}
              className="ml-auto"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-1 animate-spin" />
                  {t("buttons.updating") || "Updating..."}
                </>
              ) : (
                <>
                  <Check className="size-4 mr-1" />
                  {t("buttons.update") || "Update"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
