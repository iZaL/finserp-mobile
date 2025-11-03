"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FishItemCard } from "./fish-item-card";
import { PurchaseSummary } from "./purchase-summary";
import type { FishSpecies, FishPurchaseItem } from "@/types/fish-purchase";

interface FishItemListProps {
  items: FishPurchaseItem[];
  fishSpecies: FishSpecies[];
  onChange: (items: FishPurchaseItem[]) => void;
  errors?: Record<number, Record<string, string>>;
}

export function FishItemList({
  items,
  fishSpecies,
  onChange,
  errors = {},
}: FishItemListProps) {
  const t = useTranslations("fishPurchases.items");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({
    0: true, // First item expanded by default
  });

  const handleToggleExpand = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleUpdateItem = (index: number, updatedItem: FishPurchaseItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    onChange(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      // Don't remove the last item, just reset it
      onChange([
        {
          id: 1,
          fish_species_id: 0,
          rate: 0,
          fish_count: "",
          box_count: 0,
          average_box_weight: 0,
          net_weight: 0,
          net_amount: 0,
          box_weights: [0],
          remarks: "",
        },
      ]);
      setExpandedItems({ 0: true });
      return;
    }

    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);

    // Update expanded items indices
    const newExpandedItems: Record<number, boolean> = {};
    Object.keys(expandedItems).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex < index) {
        newExpandedItems[oldIndex] = expandedItems[oldIndex];
      } else if (oldIndex > index) {
        newExpandedItems[oldIndex - 1] = expandedItems[oldIndex];
      }
    });
    setExpandedItems(newExpandedItems);
  };

  const handleAddItem = () => {
    const newId = Math.max(...items.map((item) => item.id || 0), 0) + 1;
    const newItem: FishPurchaseItem = {
      id: newId,
      fish_species_id: 0,
      rate: 0,
      fish_count: "",
      box_count: 0,
      average_box_weight: 0,
      net_weight: 0,
      net_amount: 0,
      box_weights: [0],
      remarks: "",
    };

    // Add new item at the end
    onChange([...items, newItem]);

    // Expand the new item at the last index
    const newExpandedItems: Record<number, boolean> = {
      ...expandedItems,
      [items.length]: true,
    };
    setExpandedItems(newExpandedItems);
  };

  // Check if there are any incomplete items
  const hasIncompleteItems = items.some(
    (item) =>
      !item.fish_species_id || !item.box_count || !item.rate || item.box_weights.length === 0
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              size="sm"
              className="gap-2"
            >
              <Plus className="size-4" />
              {t("addItem")}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert for first-time users */}
      {items.length === 1 && items[0].box_weights.length === 0 && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription className="text-sm">
            {t("helpText")}
          </AlertDescription>
        </Alert>
      )}

      {/* Fish Items */}
      <div className="space-y-4">
        {[...items].reverse().map((item, reversedIndex) => {
          const actualIndex = items.length - 1 - reversedIndex;
          return (
            <FishItemCard
              key={item.id || actualIndex}
              item={item}
              index={actualIndex}
              fishSpecies={fishSpecies}
              expanded={expandedItems[actualIndex] || false}
              onToggleExpand={() => handleToggleExpand(actualIndex)}
              onUpdate={(updatedItem) => handleUpdateItem(actualIndex, updatedItem)}
              onRemove={() => handleRemoveItem(actualIndex)}
              errors={errors[item.id || actualIndex]}
              canRemove={items.length > 1}
            />
          );
        })}
      </div>

      {/* Summary */}
      {items.length > 0 && !hasIncompleteItems && (
        <PurchaseSummary items={items} showDetails={true} fishSpecies={fishSpecies} />
      )}

      {/* Warning for incomplete items */}
      {hasIncompleteItems && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-sm">
            {t("incompleteItemsWarning")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
