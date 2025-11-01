"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Package,
  Scale,
  CircleDollarSign,
  Plus,
  X,
  Fish,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fishPurchaseService } from "@/lib/services/fish-purchase";
import type { FishSpecies, FishPurchaseItem } from "@/types/fish-purchase";

interface FishItemCardProps {
  item: FishPurchaseItem;
  index: number;
  fishSpecies: FishSpecies[];
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (item: FishPurchaseItem) => void;
  onRemove: () => void;
  errors?: Record<string, string>;
  canRemove?: boolean;
}

export function FishItemCard({
  item,
  index,
  fishSpecies,
  expanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  errors = {},
  canRemove = true,
}: FishItemCardProps) {
  const t = useTranslations("fishPurchases.items");
  const [boxWeights, setBoxWeights] = useState<number[]>(item.box_weights || []);

  // Recalculate when box weights or rate changes
  useEffect(() => {
    if (boxWeights.length > 0 && item.rate && item.box_count) {
      const calculated = fishPurchaseService.calculateFishItem(
        item.box_count,
        boxWeights,
        item.rate
      );

      onUpdate({
        ...item,
        box_weights: boxWeights,
        average_box_weight: calculated.averageBoxWeight,
        net_weight: calculated.netWeight,
        net_amount: calculated.netAmount,
      });
    }
  }, [boxWeights, item.rate, item.box_count]);

  const handleFieldChange = (field: keyof FishPurchaseItem, value: any) => {
    onUpdate({ ...item, [field]: value });
  };

  const handleAddBoxWeight = () => {
    setBoxWeights([...boxWeights, 0]);
  };

  const handleRemoveBoxWeight = (weightIndex: number) => {
    const newWeights = boxWeights.filter((_, i) => i !== weightIndex);
    setBoxWeights(newWeights);
  };

  const handleBoxWeightChange = (weightIndex: number, value: string) => {
    const newWeights = [...boxWeights];
    newWeights[weightIndex] = parseFloat(value) || 0;
    setBoxWeights(newWeights);
  };

  const selectedSpecies = fishSpecies.find(
    (s) => s.id === item.fish_species_id
  );

  return (
    <Card className={expanded ? "border-primary" : ""}>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Item Number Badge */}
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {index + 1}
            </div>

            {/* Species Name or Placeholder */}
            <div className="flex-1">
              {selectedSpecies ? (
                <div className="flex items-center gap-2">
                  <Fish className="size-4 text-primary" />
                  <span className="font-medium">{selectedSpecies.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t("selectSpecies")}
                </span>
              )}
            </div>

            {/* Summary Badges */}
            {!expanded && item.box_count > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Package className="size-3 mr-1" />
                  {item.box_count}
                </Badge>
                {item.net_weight > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Scale className="size-3 mr-1" />
                    {item.net_weight.toFixed(2)} kg
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 pt-0 space-y-4">
          {/* Fish Species */}
          <div className="space-y-2">
            <Label>
              {t("species")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={item.fish_species_id && item.fish_species_id > 0 ? item.fish_species_id.toString() : undefined}
              onValueChange={(value) =>
                handleFieldChange("fish_species_id", parseInt(value))
              }
            >
              <SelectTrigger className={errors.fish_species_id ? "border-destructive" : ""}>
                <SelectValue placeholder={t("selectSpecies")} />
              </SelectTrigger>
              <SelectContent>
                {fishSpecies.map((species) => (
                  <SelectItem key={species.id} value={species.id.toString()}>
                    {species.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fish_species_id && (
              <p className="text-xs text-destructive">{errors.fish_species_id}</p>
            )}
          </div>

          {/* Box Count & Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t("boxCount")} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={item.box_count || ""}
                onChange={(e) =>
                  handleFieldChange("box_count", parseInt(e.target.value) || 0)
                }
                placeholder="0"
                min="1"
                className={errors.box_count ? "border-destructive" : ""}
              />
              {errors.box_count && (
                <p className="text-xs text-destructive">{errors.box_count}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                {t("rate")} (OMR/kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.001"
                value={item.rate || ""}
                onChange={(e) =>
                  handleFieldChange("rate", parseFloat(e.target.value) || 0)
                }
                placeholder="0.000"
                min="0.001"
                className={errors.rate ? "border-destructive" : ""}
              />
              {errors.rate && (
                <p className="text-xs text-destructive">{errors.rate}</p>
              )}
            </div>
          </div>

          {/* Box Weights */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                {t("boxWeights")} (kg) <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBoxWeight}
                className="h-8"
              >
                <Plus className="size-3 mr-1" />
                {t("addBox")}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {boxWeights.map((weight, weightIndex) => (
                <div key={weightIndex} className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    value={weight || ""}
                    onChange={(e) =>
                      handleBoxWeightChange(weightIndex, e.target.value)
                    }
                    placeholder="0.0"
                    min="0.1"
                    className="pr-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBoxWeight(weightIndex)}
                    className="absolute right-0 top-0 size-8"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>

            {boxWeights.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("addBoxWeightsHint")}
              </p>
            )}
            {errors.box_weights && (
              <p className="text-xs text-destructive">{errors.box_weights}</p>
            )}
          </div>

          {/* Calculated Values (Read-only) */}
          {boxWeights.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("avgBoxWeight")}</p>
                <p className="text-lg font-bold">
                  {item.average_box_weight?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("netWeight")}</p>
                <p className="text-lg font-bold">
                  {item.net_weight?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t("netAmount")}</p>
                <p className="text-lg font-bold text-primary">
                  {item.net_amount?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground">OMR</p>
              </div>
            </div>
          )}

          {/* Fish Count (Optional) */}
          <div className="space-y-2">
            <Label>{t("fishCount")}</Label>
            <Input
              value={item.fish_count || ""}
              onChange={(e) => handleFieldChange("fish_count", e.target.value)}
              placeholder={t("fishCountPlaceholder")}
            />
          </div>

          {/* Remarks (Optional) */}
          <div className="space-y-2">
            <Label>{t("remarks")}</Label>
            <Textarea
              value={item.remarks || ""}
              onChange={(e) => handleFieldChange("remarks", e.target.value)}
              placeholder={t("remarksPlaceholder")}
              rows={2}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
