"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsKPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  className?: string
}

export function StatsKPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  className,
}: StatsKPICardProps) {
  const getTrendColor = (trendValue: number) => {
    if (trendValue > 0) return "text-green-600"
    if (trendValue < 0) return "text-red-600"
    return "text-muted-foreground"
  }

  const getTrendIcon = (trendValue: number) => {
    if (trendValue > 0) return <ArrowUp className="h-3 w-3" />
    if (trendValue < 0) return <ArrowDown className="h-3 w-3" />
    return null
  }

  return (
    <Card className={cn("p-4 space-y-2", className)}>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        </div>
        {badge && (
          <Badge variant={badge.variant || "default"} className="text-xs">
            {badge.label}
          </Badge>
        )}
      </div>

      {/* Main Value */}
      <div className="space-y-1">
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs", getTrendColor(trend.value))}>
          {getTrendIcon(trend.value)}
          <span className="font-medium">
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </Card>
  )
}
