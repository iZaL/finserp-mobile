"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/shared";

interface SupplierSelectorProps {
  suppliers: Contact[];
  selectedSupplierId?: number;
  onSelect: (supplier: Contact | null) => void;
  disabled?: boolean;
}

export function SupplierSelector({
  suppliers,
  selectedSupplierId,
  onSelect,
  disabled = false,
}: SupplierSelectorProps) {
  const t = useTranslations("fishPurchases.supplier");
  const [open, setOpen] = useState(false);

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  return (
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
            <CommandEmpty>{t("notFound")}</CommandEmpty>
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
      </PopoverContent>
    </Popover>
  );
}
