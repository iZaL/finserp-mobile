"use client";

import { use, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, Edit, Trash2, CheckCircle, XCircle, Loader2, Package, Scale, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFishPurchase, useDeleteFishPurchase } from "@/hooks/use-fish-purchases";
import { toast } from "sonner";
import type { FishPurchaseStatus } from "@/types/fish-purchase";
import { cn } from "@/lib/utils";

export default function FishPurchaseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("fishPurchases");
  const { data: purchase, loading } = useFishPurchase(parseInt(id));
  const { deletePurchase, loading: deleting } = useDeleteFishPurchase();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getStatusColor = (status: FishPurchaseStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "approved":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "paid":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "closed":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const handleDelete = async () => {
    try {
      await deletePurchase(parseInt(id));
      router.push("/fish-purchases");
      toast.success(t("deleteSuccess"));
    } catch (error) {
      toast.error(t("deleteError"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!purchase) {
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
    <div className="container mx-auto p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{purchase.bill_number}</h1>
              <Badge className={cn("text-xs", getStatusColor(purchase.status))}>
                {t(`status.${purchase.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {purchase.date_formatted || new Date(purchase.date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        {purchase.status === "draft" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
            <Button size="icon">
              <Edit className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="size-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("summary.totalBoxes")}</p>
            <p className="text-2xl font-bold">{purchase.total_boxes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Scale className="size-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("summary.totalWeight")}</p>
            <p className="text-2xl font-bold">{purchase.total_weight.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CircleDollarSign className="size-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("summary.totalAmount")}</p>
            <p className="text-2xl font-bold text-primary">{purchase.total_amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">OMR</p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("details.supplierInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">{t("supplier.name")}:</dt>
            <dd className="font-medium">{purchase.contact_name}</dd>
            <dt className="text-muted-foreground">{t("supplier.phone")}:</dt>
            <dd className="font-medium">{purchase.contact_number}</dd>
            {purchase.account_number && (
              <>
                <dt className="text-muted-foreground">{t("supplier.account")}:</dt>
                <dd className="font-medium">{purchase.account_number}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Purchase Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("details.purchaseDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-muted-foreground">{t("details.vehicleNumber")}:</dt>
            <dd className="font-medium">{purchase.vehicle_number}</dd>
            <dt className="text-muted-foreground">{t("details.driverName")}:</dt>
            <dd className="font-medium">{purchase.driver_name}</dd>
            {purchase.driver_number && (
              <>
                <dt className="text-muted-foreground">{t("details.driverNumber")}:</dt>
                <dd className="font-medium">{purchase.driver_number}</dd>
              </>
            )}
            <dt className="text-muted-foreground">{t("details.location")}:</dt>
            <dd className="font-medium">{purchase.location?.name || "-"}</dd>
          </dl>
        </CardContent>
      </Card>

      {/* Fish Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("items.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchase.items?.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {index + 1}
                      </span>
                      <h4 className="font-semibold">{item.fish_species?.name}</h4>
                    </div>
                    {item.fish_count && (
                      <p className="text-xs text-muted-foreground">
                        {t("items.fishCount")}: {item.fish_count}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {item.net_amount.toFixed(2)} OMR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @ {item.rate.toFixed(3)} OMR/kg
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("items.boxes")}</p>
                    <p className="font-semibold">{item.box_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("items.avgWeight")}</p>
                    <p className="font-semibold">{item.average_box_weight.toFixed(2)} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("items.totalWeight")}</p>
                    <p className="font-semibold">{item.net_weight.toFixed(2)} kg</p>
                  </div>
                </div>

                {item.remarks && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                    {t("items.remarks")}: {item.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("deleteDialog.deleting")}
                </>
              ) : (
                t("deleteDialog.confirm")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
