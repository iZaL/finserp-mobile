'use client';

import {use, useMemo, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {
  User,
  FileText,
  Package,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {toast} from 'sonner';
import {ProgressSteps} from '@/components/fish-purchase/progress-steps';
import {SupplierSelector} from '@/components/fish-purchase/supplier-selector';
import {PurchaseDetailsForm} from '@/components/fish-purchase/purchase-details-form';
import {FishItemList} from '@/components/fish-purchase/fish-item-list';
import {PurchaseSummary} from '@/components/fish-purchase/purchase-summary';
import {useFishPurchaseForm} from '@/hooks/use-fish-purchase-form';
import {
  useFishPurchase,
  useUpdateFishPurchase,
} from '@/hooks/use-fish-purchases';
import {FishPurchasesGuard} from '@/components/permission-guard';

export default function EditFishPurchasePage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = use(params);
  const router = useRouter();
  const t = useTranslations('fishPurchases');

  // Load existing purchase data
  const {data: existingPurchase, isLoading: loadingPurchase} = useFishPurchase(
    parseInt(id)
  );

  const updateMutation = useUpdateFishPurchase();

  const {
    formData,
    getValues,
    setValue,
    batchSetValue,
    errors,
    errorMessages,
    activeStep,
    locations,
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
  } = useFishPurchaseForm({});

  // Load existing purchase data into form - FIXED: Using batch update
  useEffect(() => {
    if (existingPurchase && fishSpecies.length > 0) {
      // Batch update all basic fields at once
      batchSetValue(
        {
          contact_id: existingPurchase.contact_id,
          contact_name: existingPurchase.contact_name || '',
          contact_number: existingPurchase.contact_number || '',
          bank_id: existingPurchase.bank_id,
          account_number: existingPurchase.account_number || '',
          bill_number: existingPurchase.bill_number || '',
          vehicle_number: existingPurchase.vehicle_number || '',
          driver_name: existingPurchase.driver_name || '',
          driver_number: existingPurchase.driver_number || '',
          fish_location_id: existingPurchase.fish_location_id,
          date: existingPurchase.date || '',
          agent_id: existingPurchase.agent_id,
        },
        {shouldDirty: false}
      );

      // Convert items and OMR rate to BZ
      if (existingPurchase.items) {
        const convertedItems = existingPurchase.items.map((item) => ({
          id: item.id,
          fish_species_id: item.fish_species_id,
          box_count: item.box_count,
          box_weights: item.box_weights,
          rate: Math.round(item.rate * 1000), // Convert OMR to BZ
          fish_count: item.fish_count || '',
          remarks: item.remarks || '',
          average_box_weight: item.average_box_weight,
          net_weight: item.net_weight,
          net_amount: item.net_amount,
        }));
        setValue('items', convertedItems, {shouldDirty: false});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPurchase?.id, fishSpecies.length, batchSetValue, setValue]);

  // Memoized steps to prevent recreation
  const steps = useMemo(
    () => [
      {id: 'supplier' as const, label: t('steps.supplier'), icon: User},
      {id: 'details' as const, label: t('steps.details'), icon: FileText},
      {id: 'items' as const, label: t('steps.items'), icon: Package},
      {id: 'review' as const, label: t('steps.review'), icon: ClipboardCheck},
    ],
    [t]
  );

  // Submit handler
  const handleSubmit = async () => {
    try {
      const data = getValues();
      const requestData = transformFormData(data);

      const result = await updateMutation.mutateAsync({
        id: parseInt(id),
        data: requestData,
      });

      toast.success(t('updateSuccess') || 'Fish purchase updated successfully');
      router.push(`/fish-purchases/${result.id}`);
    } catch (error) {
      console.error('Failed to update fish purchase:', error);
      toast.error(t('updateError') || 'Failed to update fish purchase');
    }
  };

  if (loadingPurchase || dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    );
  }

  if (!existingPurchase) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">{t('notFound')}</p>
        <Button onClick={() => router.push('/fish-purchases')}>
          {t('backToList')}
        </Button>
      </div>
    );
  }

  return (
    <FishPurchasesGuard>
      <div className="container mx-auto max-w-4xl p-4 pb-32">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t('edit') || 'Edit Fish Purchase'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {existingPurchase.bill_number}
            </p>
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
        <div className="mt-6 space-y-6">
          {/* Supplier Step */}
          {activeStep === 'supplier' && (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <Label>
                    {t('supplier.select')}{' '}
                    <span className="text-destructive">*</span>
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
                    <span className="bg-background text-muted-foreground px-2 py-2 font-semibold">
                      {t('supplier.orManual')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">
                      {t('supplier.name')}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contact_name"
                      value={formData.contact_name || ''}
                      onChange={(e) => setValue('contact_name', e.target.value)}
                      placeholder={t('supplier.namePlaceholder')}
                    />
                    {errors.contact_name && (
                      <p className="text-destructive text-xs">
                        {errors.contact_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_number">
                      {t('supplier.phone')}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number || ''}
                      onChange={(e) =>
                        setValue('contact_number', e.target.value)
                      }
                      placeholder={t('supplier.phonePlaceholder')}
                    />
                    {errors.contact_number && (
                      <p className="text-destructive text-xs">
                        {errors.contact_number.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details Step */}
          {activeStep === 'details' && (
            <PurchaseDetailsForm
              formData={formData}
              onChange={(data) => {
                Object.entries(data).forEach(([key, value]) => {
                  setValue(key as keyof typeof formData, value);
                });
              }}
              locations={locations}
              agents={agents}
              errors={errorMessages}
              onAddLocation={handleAddLocation}
            />
          )}

          {/* Items Step */}
          {activeStep === 'items' && (
            <FishItemList
              items={formData.items}
              fishSpecies={fishSpecies}
              onChange={(items) => setValue('items', items)}
              errors={{}}
            />
          )}

          {/* Review Step */}
          {activeStep === 'review' && (
            <div className="space-y-4">
              <div className="bg-card space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">
                  {t('review.supplierInfo')}
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">
                    {t('supplier.name')}:
                  </dt>
                  <dd className="font-medium">{formData.contact_name}</dd>
                  <dt className="text-muted-foreground">
                    {t('supplier.phone')}:
                  </dt>
                  <dd className="font-medium">{formData.contact_number}</dd>
                </dl>
              </div>

              <div className="bg-card space-y-3 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">
                  {t('review.purchaseDetails')}
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">
                    {t('details.billNumber')}:
                  </dt>
                  <dd className="font-medium">{formData.bill_number}</dd>
                  <dt className="text-muted-foreground">
                    {t('details.vehicleNumber')}:
                  </dt>
                  <dd className="font-medium">{formData.vehicle_number}</dd>
                  <dt className="text-muted-foreground">
                    {t('details.driverName')}:
                  </dt>
                  <dd className="font-medium">{formData.driver_name}</dd>
                </dl>
              </div>

              <PurchaseSummary
                items={formData.items}
                showDetails={true}
                fishSpecies={fishSpecies}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="bg-background/95 border-border fixed right-0 bottom-16 left-0 z-50 border-t p-4 shadow-lg backdrop-blur-sm">
          <div className="container mx-auto flex max-w-4xl items-center justify-between gap-2">
            {activeStep !== 'supplier' ? (
              <Button variant="outline" onClick={handlePrevious} size="lg">
                <ChevronLeft className="mr-1 size-4" />
                {t('buttons.previous')}
              </Button>
            ) : (
              <div />
            )}

            {activeStep !== 'review' ? (
              <Button
                onClick={handleNext}
                disabled={!isStepComplete(activeStep)}
                className="ml-auto"
                size="lg"
              >
                {t('buttons.next')}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="ml-auto"
                size="lg"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1 size-4 animate-spin" />
                    {t('buttons.updating') || 'Updating...'}
                  </>
                ) : (
                  <>
                    <Check className="mr-1 size-4" />
                    {t('buttons.update') || 'Update'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </FishPurchasesGuard>
  );
}
