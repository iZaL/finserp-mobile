"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  FileText,
  Download,
  Eye,
  Search,
  Image as ImageIcon,
  FileType,
  Truck,
  ArrowLeft,
  LayoutGrid,
  List
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { vehicleBookingService } from "@/lib/services/vehicle-booking";
import axios from "axios";
import { FilePreviewModal } from "@/components/vehicle-booking/FilePreviewModal";
import { BillAttachmentsGuard } from "@/components/permission-guard";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { format, subDays, startOfMonth, differenceInDays } from "date-fns";
import type { VehicleBooking, Media } from "@/types/vehicle-booking";

// File Icon Component
interface FileIconProps {
  mimeType: string;
  size?: "sm" | "lg";
}

function FileIcon({ mimeType, size = "sm" }: FileIconProps) {
  const iconClass = size === "sm" ? "size-4" : "size-8";

  if (mimeType?.startsWith('image/')) {
    return <ImageIcon className={`${iconClass} text-green-600`} />;
  }
  if (mimeType === 'application/pdf') {
    return <FileType className={`${iconClass} text-red-600`} />;
  }
  return <FileText className={`${iconClass} text-muted-foreground`} />;
}

// Format date as DD/MM/YYYY
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // This gives DD/MM/YYYY format
}

export default function VehicleBillsPage() {
  const t = useTranslations("bills");
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleBooking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Media | null>(null);
  const [totalBills, setTotalBills] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Simple date filter states
  const [dateFrom, setDateFrom] = useState(() => {
    const sixMonthsAgo = subDays(new Date(), 180); // 6 months instead of 30 days
    return format(sixMonthsAgo, "yyyy-MM-dd");
  });
  const [dateTo, setDateTo] = useState(() => {
    return format(new Date(), "yyyy-MM-dd");
  });

  // Date preset handlers
  const handlePreset = (preset: 'today' | 'last7' | 'last30' | 'thisMonth') => {
    const today = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'last7':
        from = subDays(today, 6);
        to = today;
        break;
      case 'last30':
        from = subDays(today, 29);
        to = today;
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = today;
        break;
    }

    setDateFrom(format(from, 'yyyy-MM-dd'));
    setDateTo(format(to, 'yyyy-MM-dd'));
  };

  // Calculate day count for display
  const getDayCount = () => {
    try {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      return differenceInDays(to, from) + 1;
    } catch {
      return 0;
    }
  };

  // Fetch vehicles with bills
  useEffect(() => {
    const abortController = new AbortController();

    const fetchBills = async () => {
      setLoading(true);
      try {
        const response = await vehicleBookingService.getBillsGallery(
          {
            search: searchQuery.trim() || undefined,
            date_from: dateFrom,
            date_to: dateTo,
          },
          { signal: abortController.signal }
        );
        setVehicles(response.data);

        // Calculate total bills across all vehicles
        const total = response.data.reduce((acc, vehicle) => {
          const billCount = vehicle.bill_attachments?.length || 0;
          return acc + billCount;
        }, 0);
        setTotalBills(total);
      } catch (error: unknown) {
        if (!axios.isCancel(error)) {
          console.error("Failed to fetch bills:", error);
          toast.error("Failed to load bills");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBills();
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [searchQuery, dateFrom, dateTo]);

  // Get all bills flattened with vehicle info
  const allBills = vehicles.flatMap(vehicle =>
    (vehicle.bill_attachments || []).map(attachment => ({
      ...attachment,
      vehicle_number: vehicle.vehicle_number,
      vehicle_id: vehicle.id,
      uploaded_at: attachment.created_at
    }))
  );

  const handlePreview = (attachment: Media) => {
    setPreviewAttachment(attachment);
  };

  const handleDownload = (attachment: Media) => {
    window.open(attachment.url, '_blank');
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <BillAttachmentsGuard>
      <div className="space-y-6 p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Simple Date Filter */}
      <Card className="p-3 space-y-2">
        {/* Date Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-[10px] font-medium text-muted-foreground">
              {t("fromLabel")}
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-[10px] font-medium text-muted-foreground">
              {t("toLabel")}
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset("today")}
            className="text-xs h-7 px-2"
          >
            {t("todayButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset("last7")}
            className="text-xs h-7 px-2"
          >
            {t("sevenDaysButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset("last30")}
            className="text-xs h-7 px-2"
          >
            {t("thirtyDaysButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreset("thisMonth")}
            className="text-xs h-7 px-2"
          >
            {t("thisMonthButton")}
          </Button>
        </div>

        {/* Info Text */}
        {getDayCount() > 0 && (
          <div className="text-center text-[10px] text-muted-foreground">
            {t("showingBillsForDays", { days: getDayCount() })}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <div className="text-2xl font-bold">{totalBills}</div>
          <div className="text-sm text-muted-foreground">{t('totalBills')}</div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="text-2xl font-bold">{vehicles.length}</div>
          <div className="text-sm text-muted-foreground">{t("vehiclesLabel")}</div>
        </div>
      </div>

      {/* Bills Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("loadingBills")}</div>
        </div>
      ) : allBills.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View - Compact */
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {allBills.map((bill) => (
              <div
                key={`${bill.vehicle_id}-${bill.id}`}
                className="bg-card rounded-lg border p-3 space-y-2"
              >
                {/* Preview Thumbnail */}
                <div
                  className="aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(bill);
                  }}
                >
                  {isImage(bill.mime_type) ? (
                    <Image
                      src={bill.url}
                      alt={bill.file_name}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <FileIcon mimeType={bill.mime_type} size="lg" />
                  )}
                </div>

                {/* Bill Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Truck className="size-3 text-blue-600" />
                    <span className="text-sm font-medium truncate">{bill.vehicle_number}</span>
                  </div>

                  <div className="text-xs text-muted-foreground truncate">
                    {bill.file_name}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatDate(bill.uploaded_at)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(bill);
                        }}
                      >
                        <Download className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View - Compact */
          <div className="space-y-2">
            {allBills.map((bill) => (
              <div
                key={`${bill.vehicle_id}-${bill.id}`}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border"
              >
                {/* File Icon */}
                <div className="shrink-0">
                  <FileIcon mimeType={bill.mime_type} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Truck className="size-3 text-blue-600" />
                    <span className="font-medium">{bill.vehicle_number}</span>
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {bill.file_name}
                  </div>
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground shrink-0">
                  {formatDate(bill.uploaded_at)}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(bill);
                    }}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(bill);
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('noBillsFound')}</h3>
          <p className="text-muted-foreground">{t('noBillsDescription')}</p>
        </div>
      )}

      {/* Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />
      </div>
    </BillAttachmentsGuard>
  );
}