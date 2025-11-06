"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Plus, Search, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useFishPurchases } from "@/hooks/use-fish-purchases";
import type { FishPurchaseStatus } from "@/types/fish-purchase";
import { cn } from "@/lib/utils";

export default function FishPurchasesPage() {
  const router = useRouter();
  const t = useTranslations("fishPurchases");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FishPurchaseStatus>("all");

  const { data, loading } = useFishPurchases({
    search: searchQuery,
    status: statusFilter,
    per_page: 20,
  });

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

  return (
    <div className="container mx-auto p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("listDescription")}</p>
        </div>
        <Button onClick={() => router.push("/fish-purchases/new")}>
          <Plus className="size-4 mr-2" />
          {t("createNew")}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FishPurchaseStatus | "all")}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">{t("status.all")}</TabsTrigger>
            <TabsTrigger value="draft">{t("status.draft")}</TabsTrigger>
            <TabsTrigger value="pending">{t("status.pending")}</TabsTrigger>
            <TabsTrigger value="approved">{t("status.approved")}</TabsTrigger>
            <TabsTrigger value="paid">{t("status.paid")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && data?.data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("empty.title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("empty.description")}
            </p>
            <Button onClick={() => router.push("/fish-purchases/new")}>
              <Plus className="size-4 mr-2" />
              {t("createFirst")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Purchase Cards */}
      {!loading && data && data.data.length > 0 && (
        <div className="space-y-4">
          {data.data.map((purchase) => (
            <Card
              key={purchase.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/fish-purchases/${purchase.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{purchase.bill_number}</h3>
                      <Badge className={cn("text-xs", getStatusColor(purchase.status))}>
                        {t(`status.${purchase.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {purchase.contact_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.vehicle_number} • {purchase.driver_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {purchase.total_amount.toFixed(2)} OMR
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.date_formatted || new Date(purchase.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("summary.boxes")}</p>
                    <p className="text-sm font-semibold">{purchase.total_boxes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("summary.weight")}</p>
                    <p className="text-sm font-semibold">
                      {purchase.total_weight.toFixed(2)} kg
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("summary.location")}</p>
                    <p className="text-sm font-semibold truncate">
                      {purchase.location?.name || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {data.meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={data.meta.current_page === 1}
              >
                {t("pagination.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pagination.page")} {data.meta.current_page} {t("pagination.of")}{" "}
                {data.meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.meta.current_page === data.meta.last_page}
              >
                {t("pagination.next")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
