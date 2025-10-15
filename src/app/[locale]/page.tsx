"use client"

import { useRouter } from "@/i18n/navigation"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Car, Plus, Calendar, ClipboardList } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const t = useTranslations('dashboard')

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground mt-1">
          {t('welcome')}
        </p>
      </div>

      {/* Vehicle Booking Management Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="size-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">{t('vehicleBookings')}</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            onClick={() => router.push("/vehicle-bookings")}
            className="h-auto flex-col items-start gap-2 p-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ClipboardList className="size-5" />
            <div className="text-start">
              <div className="font-semibold">{t('viewBookings')}</div>
              <div className="text-xs opacity-90 font-normal">{t('manageVehicles')}</div>
            </div>
          </Button>

          <Button
            onClick={() => router.push("/vehicle-bookings/new")}
            className="h-auto flex-col items-start gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            <Plus className="size-5" />
            <div className="text-start">
              <div className="font-semibold">{t('vehicleBookings')}</div>
              <div className="text-xs opacity-90 font-normal">{t('manageVehicles')}</div>
            </div>
          </Button>

          <Button
            onClick={() => router.push("/vehicle-bookings/calendar")}
            className="h-auto flex-col items-start gap-2 p-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            <Calendar className="size-5" />
            <div className="text-start">
              <div className="font-semibold">Calendar View</div>
              <div className="text-xs opacity-90 font-normal">View booking schedule</div>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
}
