'use client';

import {useState, useMemo, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {useQuery} from '@tanstack/react-query';
import {Check, ChevronsUpDown, User, Plus, Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {cn} from '@/lib/utils';
import {fishPurchaseService} from '@/lib/services/fish-purchase';
import {fishPurchaseKeys} from '@/lib/query-keys';
import {useDebounce} from '@/hooks/use-debounce';
import type {Contact} from '@/types/shared';

interface SupplierSelectorProps {
  suppliers: Contact[];
  selectedSupplierId?: number;
  onSelect: (supplier: Contact | null) => void | Promise<void>;
  onAddSupplier?: (data: {name: string; phone: string}) => Promise<Contact>;
  disabled?: boolean;
}

export function SupplierSelector({
  suppliers,
  selectedSupplierId,
  onSelect,
  onAddSupplier,
  disabled = false,
}: SupplierSelectorProps) {
  const t = useTranslations('fishPurchases.supplier');
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newlyCreatedSupplier, setNewlyCreatedSupplier] =
    useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch suppliers when searching (only if search query is provided)
  const {data: searchResults, isLoading: isSearching} = useQuery({
    queryKey: fishPurchaseKeys.suppliers({
      search: debouncedSearch,
      selectedSupplierId: selectedSupplierId,
    }),
    queryFn: async ({signal}) => {
      return fishPurchaseService.getSuppliers({
        signal,
        search: debouncedSearch,
        selectedSupplierId: selectedSupplierId,
      });
    },
    enabled: debouncedSearch.length > 0, // Only fetch when there's a search query
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Use search results if searching, otherwise use initial suppliers
  const displayedSuppliers = useMemo(() => {
    if (debouncedSearch.length > 0 && searchResults) {
      return searchResults;
    }
    return suppliers;
  }, [suppliers, searchResults, debouncedSearch]);

  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) return undefined;
    // First check if it's the newly created supplier
    if (
      newlyCreatedSupplier &&
      newlyCreatedSupplier.id === selectedSupplierId
    ) {
      return newlyCreatedSupplier;
    }
    // Then check the displayed suppliers (includes search results)
    return (
      displayedSuppliers.find((s) => s.id === selectedSupplierId) ||
      suppliers.find((s) => s.id === selectedSupplierId)
    ); // Fallback to initial suppliers
  }, [suppliers, displayedSuppliers, selectedSupplierId, newlyCreatedSupplier]);

  // Clear newly created supplier state once it's in the suppliers array
  useEffect(() => {
    if (
      newlyCreatedSupplier &&
      suppliers.some((s) => s.id === newlyCreatedSupplier.id)
    ) {
      setNewlyCreatedSupplier(null);
    }
  }, [suppliers, newlyCreatedSupplier]);

  // Clear search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim() || !newSupplierPhone.trim()) {
      return;
    }

    if (!onAddSupplier) {
      console.error('onAddSupplier callback is required');
      return;
    }

    setAddingSupplier(true);
    try {
      const newSupplier = await onAddSupplier({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
      });

      // Store the newly created supplier in local state
      // This ensures it's available immediately even if not in suppliers array yet
      setNewlyCreatedSupplier(newSupplier);

      // Auto-select the newly created supplier immediately (before closing dialogs)
      // This will update the form with the supplier's details and trigger validation
      // We do this first to ensure selection happens before any state updates
      await onSelect(newSupplier);

      // Close dialog and reset form after selection
      setShowAddDialog(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setOpen(false);
      setSearchQuery(''); // Clear search when adding new supplier

      // The newlyCreatedSupplier state will be cleared automatically
      // by the useEffect when the supplier appears in the suppliers array
    } catch (error) {
      console.error('Failed to create supplier:', error);
      // Error toast is handled by the parent handler
    } finally {
      setAddingSupplier(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <User className="text-muted-foreground size-4" />
              {selectedSupplier ? (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedSupplier.name}</span>
                  {selectedSupplier.phone && (
                    <span className="text-muted-foreground text-xs">
                      {selectedSupplier.phone}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">{t('select')}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('search')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isSearching && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
              )}
              {!isSearching && displayedSuppliers.length === 0 && (
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground mb-2 text-sm">
                      {t('notFound')}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false);
                        setShowAddDialog(true);
                      }}
                    >
                      <Plus className="mr-2 size-4" />
                      {t('addNew')}
                    </Button>
                  </div>
                </CommandEmpty>
              )}
              {!isSearching && displayedSuppliers.length > 0 && (
                <CommandGroup>
                  {displayedSuppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={`${supplier.name} ${supplier.phone || ''}`}
                      onSelect={() => {
                        onSelect(
                          supplier.id === selectedSupplierId ? null : supplier
                        );
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          selectedSupplierId === supplier.id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.phone && (
                          <span className="text-muted-foreground text-xs">
                            {supplier.phone}
                          </span>
                        )}
                        {supplier.bank_account && (
                          <span className="text-muted-foreground text-xs">
                            {supplier.bank_account.bank?.name} -{' '}
                            {supplier.bank_account.account_number}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false);
                setShowAddDialog(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('addNew')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addSupplierDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('addSupplierDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">
                {t('addSupplierDialog.supplierName')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supplier-name"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                placeholder={t('addSupplierDialog.supplierNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">
                {t('addSupplierDialog.supplierPhone')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="supplier-phone"
                type="tel"
                inputMode="tel"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                placeholder={t('addSupplierDialog.supplierPhonePlaceholder')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewSupplierName('');
                  setNewSupplierPhone('');
                }}
                className="flex-1"
              >
                {t('addSupplierDialog.cancel')}
              </Button>
              <Button
                onClick={handleAddSupplier}
                disabled={
                  addingSupplier ||
                  !newSupplierName.trim() ||
                  !newSupplierPhone.trim()
                }
                className="flex-1"
              >
                {addingSupplier
                  ? t('addSupplierDialog.adding')
                  : t('addSupplierDialog.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
