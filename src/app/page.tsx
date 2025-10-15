"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { employeeService } from "@/lib/services/employee"
import { Button } from "@/components/ui/button"
import { Car, Plus, Calendar, ClipboardList } from "lucide-react"

interface EmployeeStats {
  total: number
  active: number
  inactive: number
}

export default function Home() {
  const router = useRouter()
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        setLoading(true)
        const data = await employeeService.getCount()
        setEmployeeStats(data)
        setError(null)
      } catch (err) {
        console.error("Error fetching employee count:", err)
        setError("Failed to fetch employee data")
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeCount()
  }, [])

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Welcome to your ERP Mobile Progressive Web App
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
                <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </>
        ) : error ? (
          <div className="col-span-2 lg:col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-muted-foreground mb-1">Total</div>
              <p className="text-2xl font-bold">{employeeStats?.total || 0}</p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-muted-foreground mb-1">Active</div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {employeeStats?.active || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-muted-foreground mb-1">Inactive</div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {employeeStats?.inactive || 0}
              </p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="text-xs font-medium text-muted-foreground mb-1">Completed</div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
            </div>
          </>
        )}
      </div>

      {/* Vehicle Booking Management Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="size-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Vehicle Booking Management</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            onClick={() => router.push("/vehicle-bookings")}
            className="h-auto flex-col items-start gap-2 p-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <ClipboardList className="size-5" />
            <div className="text-left">
              <div className="font-semibold">View Bookings</div>
              <div className="text-xs opacity-90 font-normal">Manage all vehicle bookings</div>
            </div>
          </Button>

          <Button
            onClick={() => router.push("/vehicle-bookings/new")}
            className="h-auto flex-col items-start gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            <Plus className="size-5" />
            <div className="text-left">
              <div className="font-semibold">New Booking</div>
              <div className="text-xs opacity-90 font-normal">Create a new reservation</div>
            </div>
          </Button>

          <Button
            onClick={() => router.push("/vehicle-bookings/calendar")}
            className="h-auto flex-col items-start gap-2 p-4 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            <Calendar className="size-5" />
            <div className="text-left">
              <div className="font-semibold">Calendar View</div>
              <div className="text-xs opacity-90 font-normal">View booking schedule</div>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
}
