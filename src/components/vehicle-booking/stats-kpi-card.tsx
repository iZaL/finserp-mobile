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
    <Card className={cn("p-3 space-y-1.5", className)}>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          <h3 className="text-[10px] font-medium text-muted-foreground line-clamp-1">{title}</h3>
        </div>
        {badge && (
          <Badge variant={badge.variant || "default"} className="text-[9px] h-4 px-1.5 shrink-0">
            {badge.label}
          </Badge>
        )}
      </div>

      {/* Main Value */}
      <div className="space-y-0.5">
        <p className="text-xl font-bold leading-none">{value}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground line-clamp-1">{subtitle}</p>
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className={cn("flex items-center gap-1 text-[10px]", getTrendColor(trend.value))}>
          {getTrendIcon(trend.value)}
          <span className="font-medium">
            {trend.value > 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-muted-foreground truncate">{trend.label}</span>
        </div>
      )}
    </Card>
  )
}
