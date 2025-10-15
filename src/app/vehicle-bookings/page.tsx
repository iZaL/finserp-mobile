"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Car, Search, Filter, Plus, Calendar, User, MapPin } from "lucide-react"

interface Booking {
  id: number
  vehicleName: string
  customerName: string
  startDate: string
  endDate: string
  status: "active" | "pending" | "completed" | "cancelled"
  location: string
}

// Mock data
const mockBookings: Booking[] = [
  {
    id: 1,
    vehicleName: "Toyota Camry 2024",
    customerName: "John Doe",
    startDate: "2025-10-15",
    endDate: "2025-10-20",
    status: "active",
    location: "Dubai Marina"
  },
  {
    id: 2,
    vehicleName: "Honda Accord 2023",
    customerName: "Jane Smith",
    startDate: "2025-10-16",
    endDate: "2025-10-18",
    status: "pending",
    location: "Business Bay"
  },
  {
    id: 3,
    vehicleName: "BMW 5 Series",
    customerName: "Mike Johnson",
    startDate: "2025-10-10",
    endDate: "2025-10-14",
    status: "completed",
    location: "Downtown Dubai"
  },
]

export default function VehicleBookingsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [bookings] = useState<Booking[]>(mockBookings)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "pending":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vehicle Bookings</h2>
          <p className="text-muted-foreground mt-1">Manage your vehicle reservations</p>
        </div>
        <Button
          onClick={() => router.push("/vehicle-bookings/new")}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="size-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by vehicle, customer, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Car className="size-4" />
            <span className="text-xs font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold">
            {bookings.filter((b) => b.status === "active").length}
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="size-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold">
            {bookings.filter((b) => b.status === "pending").length}
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="size-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold">
            {bookings.filter((b) => b.status === "completed").length}
          </p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Car className="size-4" />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold">{bookings.length}</p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-12 text-center">
            <Car className="size-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating your first booking"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => router.push("/vehicle-bookings/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="size-4 mr-2" />
                Create Booking
              </Button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/vehicle-bookings/${booking.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Car className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{booking.vehicleName}</h4>
                    <p className="text-xs text-muted-foreground">ID: #{booking.id}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  <span>{booking.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{booking.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <Calendar className="size-4" />
                  <span>
                    {booking.startDate} to {booking.endDate}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
