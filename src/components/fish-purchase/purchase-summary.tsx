"use client";

import { useTranslations } from "next-intl";
import { Package, Scale, CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FishPurchaseItem } from "@/types/fish-purchase";

interface PurchaseSummaryProps {
  items: FishPurchaseItem[];
  showDetails?: boolean;
}

export function PurchaseSummary({ items, showDetails = true }: PurchaseSummaryProps) {
  const t = useTranslations("fishPurchases");

  // Calculate totals
  const totalBoxes = items.reduce((sum, item) => sum + (item.box_count || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.net_weight || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.net_amount || 0), 0);

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("summary.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Boxes */}
          <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <Package className="size-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{t("summary.totalBoxes")}</p>
            <p className="text-xl font-bold">{totalBoxes}</p>
          </div>

          {/* Total Weight */}
          <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <Scale className="size-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{t("summary.totalWeight")}</p>
            <p className="text-xl font-bold">{totalWeight.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>

          {/* Total Amount */}
          <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <CircleDollarSign className="size-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">{t("summary.totalAmount")}</p>
            <p className="text-xl font-bold">{totalAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">OMR</p>
          </div>
        </div>

        {/* Item Details */}
        {showDetails && items.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">{t("summary.itemBreakdown")}</p>
            <div className="space-y-1">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex justify-between text-sm text-muted-foreground"
                >
                  <span>
                    {item.fish_species?.name || t("items.species")} × {item.box_count}
                  </span>
                  <span className="font-medium">
                    {item.net_weight?.toFixed(2)} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
