"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Users, Plus, FileText, Truck, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Address, Contact } from "@/types/shared";
import type { PurchaseDetailsStepFormData } from "@/lib/validation/fish-purchase";

interface PurchaseDetailsFormProps {
  formData: Partial<PurchaseDetailsStepFormData>;
  onChange: (data: Partial<PurchaseDetailsStepFormData>) => void;
  locations: Address[];
  agents: Contact[];
  errors?: Record<string, string>;
  onAddLocation?: (location: { name: string; city?: string }) => Promise<Address>;
}

export function PurchaseDetailsForm({
  formData,
  onChange,
  locations,
  agents,
  errors = {},
  onAddLocation,
}: PurchaseDetailsFormProps) {
  const t = useTranslations("fishPurchases.details");
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationCity, setNewLocationCity] = useState("");
  const [addingLocation, setAddingLocation] = useState(false);

  const handleChange = (field: keyof PurchaseDetailsStepFormData, value: string | number | undefined) => {
    onChange({ ...formData, [field]: value });
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;

    setAddingLocation(true);
    try {
      if (onAddLocation) {
        const newLocation = await onAddLocation({
          name: newLocationName.trim(),
          city: newLocationCity.trim() || undefined,
        });
        handleChange("fish_location_id", newLocation.id);
      }
      setShowLocationDialog(false);
      setNewLocationName("");
      setNewLocationCity("");
    } catch (error) {
      console.error("Failed to add location:", error);
    } finally {
      setAddingLocation(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bill Number, Vehicle Number, Driver Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bill_number">
              {t("billNumber")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="bill_number"
                value={formData.bill_number || ""}
                onChange={(e) => handleChange("bill_number", e.target.value)}
                placeholder={t("billNumberPlaceholder")}
                className="pl-10"
              />
            </div>
            {errors.bill_number && (
              <p className="text-xs text-destructive">{errors.bill_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle_number">
              {t("vehicleNumber")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="vehicle_number"
                value={formData.vehicle_number || ""}
                onChange={(e) => handleChange("vehicle_number", e.target.value)}
                placeholder={t("vehicleNumberPlaceholder")}
                className="pl-10"
              />
            </div>
            {errors.vehicle_number && (
              <p className="text-xs text-destructive">{errors.vehicle_number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_name">
              {t("driverName")} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="driver_name"
                value={formData.driver_name || ""}
                onChange={(e) => handleChange("driver_name", e.target.value)}
                placeholder={t("driverNamePlaceholder")}
                className="pl-10"
              />
            </div>
            {errors.driver_name && (
              <p className="text-xs text-destructive">{errors.driver_name}</p>
            )}
          </div>
        </div>

        {/* Location & Agent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fish_location_id">
              {t("location")} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.fish_location_id && formData.fish_location_id > 0 ? formData.fish_location_id.toString() : undefined}
              onValueChange={(value) =>
                handleChange("fish_location_id", parseInt(value))
              }
            >
              <SelectTrigger id="fish_location_id">
                <MapPin className="size-4 text-muted-foreground mr-2" />
                <SelectValue placeholder={t("selectLocation")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
                {onAddLocation && (
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLocationDialog(true)}
                      className="w-full justify-start gap-2"
                    >
                      <Plus className="size-4" />
                      {t("addLocation")}
                    </Button>
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.fish_location_id && (
              <p className="text-xs text-destructive">{errors.fish_location_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_id">{t("agent")}</Label>
            <Select
              value={formData.agent_id?.toString() || "none"}
              onValueChange={(value) =>
                handleChange("agent_id", value === "none" ? undefined : parseInt(value))
              }
            >
              <SelectTrigger id="agent_id">
                <Users className="size-4 text-muted-foreground mr-2" />
                <SelectValue placeholder={t("selectAgent")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">{t("noAgent")}</span>
                </SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <Label htmlFor="remarks">{t("remarks")}</Label>
          <Textarea
            id="remarks"
            value={formData.remarks || ""}
            onChange={(e) => handleChange("remarks", e.target.value)}
            placeholder={t("remarksPlaceholder")}
            rows={3}
          />
        </div>
      </CardContent>

      {/* Add Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addLocationDialog.title")}</DialogTitle>
            <DialogDescription>{t("addLocationDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location_name">
                {t("addLocationDialog.locationName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location_name"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder={t("addLocationDialog.locationNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_city">{t("addLocationDialog.city")}</Label>
              <Input
                id="location_city"
                value={newLocationCity}
                onChange={(e) => setNewLocationCity(e.target.value)}
                placeholder={t("addLocationDialog.cityPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLocationDialog(false);
                setNewLocationName("");
                setNewLocationCity("");
              }}
              disabled={addingLocation}
            >
              {t("addLocationDialog.cancel")}
            </Button>
            <Button
              onClick={handleAddLocation}
              disabled={!newLocationName.trim() || addingLocation}
            >
              {addingLocation ? t("addLocationDialog.adding") : t("addLocationDialog.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
