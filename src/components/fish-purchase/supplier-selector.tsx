"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fishPurchaseService } from "@/lib/services/fish-purchase";
import type { Contact } from "@/types/shared";

interface SupplierSelectorProps {
  suppliers: Contact[];
  selectedSupplierId?: number;
  onSelect: (supplier: Contact | null) => void;
  onSupplierAdded?: (supplier: Contact) => void;
  disabled?: boolean;
}

export function SupplierSelector({
  suppliers,
  selectedSupplierId,
  onSelect,
  onSupplierAdded,
  disabled = false,
}: SupplierSelectorProps) {
  const t = useTranslations("fishPurchases.supplier");
  const [open, setOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim() || !newSupplierPhone.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setAddingSupplier(true);
    try {
      const newSupplier = await fishPurchaseService.createSupplier({
        name: newSupplierName.trim(),
        phone: newSupplierPhone.trim(),
      });
      
      toast.success("Supplier added successfully");
      setShowAddDialog(false);
      setNewSupplierName("");
      setNewSupplierPhone("");
      
      // Notify parent to refresh suppliers list
      if (onSupplierAdded) {
        onSupplierAdded(newSupplier);
      }
      
      // Auto-select the newly created supplier
      onSelect(newSupplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      toast.error("Failed to add supplier");
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
            <User className="size-4 text-muted-foreground" />
            {selectedSupplier ? (
              <div className="flex flex-col items-start">
                <span className="font-medium">{selectedSupplier.name}</span>
                {selectedSupplier.phone && (
                  <span className="text-xs text-muted-foreground">
                    {selectedSupplier.phone}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{t("select")}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={t("search")} />
          <CommandList>
            <CommandEmpty>
              <div className="text-center p-4">
                <p className="text-sm text-muted-foreground mb-2">{t("notFound")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="size-4 mr-2" />
                  {t("addNew")}
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {suppliers.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={`${supplier.name} ${supplier.phone || ""}`}
                  onSelect={() => {
                    onSelect(supplier.id === selectedSupplierId ? null : supplier);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      selectedSupplierId === supplier.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{supplier.name}</span>
                    {supplier.phone && (
                      <span className="text-xs text-muted-foreground">
                        {supplier.phone}
                      </span>
                    )}
                    {supplier.bank_account && (
                      <span className="text-xs text-muted-foreground">
                        {supplier.bank_account.bank?.name} -{" "}
                        {supplier.bank_account.account_number}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              setShowAddDialog(true);
            }}
          >
            <Plus className="size-4 mr-2" />
            {t("addNew")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    {/* Add Supplier Dialog */}
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addSupplierDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("addSupplierDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">
              {t("addSupplierDialog.supplierName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier-name"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder={t("addSupplierDialog.supplierNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-phone">
              {t("addSupplierDialog.supplierPhone")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier-phone"
              type="tel"
              inputMode="tel"
              value={newSupplierPhone}
              onChange={(e) => setNewSupplierPhone(e.target.value)}
              placeholder={t("addSupplierDialog.supplierPhonePlaceholder")}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewSupplierName("");
                setNewSupplierPhone("");
              }}
              className="flex-1"
            >
              {t("addSupplierDialog.cancel")}
            </Button>
            <Button
              onClick={handleAddSupplier}
              disabled={addingSupplier || !newSupplierName.trim() || !newSupplierPhone.trim()}
              className="flex-1"
            >
              {addingSupplier ? t("addSupplierDialog.adding") : t("addSupplierDialog.add")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
