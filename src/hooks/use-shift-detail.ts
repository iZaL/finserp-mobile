import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {productionRunService} from '@/lib/services/production-run';
import {productionRunKeys} from '@/lib/query-keys';
import type {LucideIcon} from 'lucide-react';
import {Truck, Play, CheckCircle, Package, Droplet} from 'lucide-react';
import type {
  ProductionShift,
  ProductionRunListItem,
  ShiftOutput,
  ShiftVehicle,
  ShiftMetrics as ApiShiftMetrics,
  ShiftTimelineEvent,
} from '@/types/production-run';

export interface TimelineEvent {
  id: string;
  type: 'vehicle' | 'run_start' | 'run_end' | 'output';
  time: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  metadata?: Record<string, unknown>;
}

export interface ShiftMetrics {
  fishInputKg: number;
  fishmealOutputKg: number;
  fishOilOutputKg: number;
  vehicleCount: number;
  totalOutputKg: number;
  yieldPercentage: number;
  bagCount: number;
  tankFills: number;
}

// Re-export types for page consumption
export type {ProductionShift, ProductionRunListItem, ShiftOutput, ShiftVehicle};

// Map output type to match what the page expects
export interface ProductionOutput {
  id: number;
  record_number: string;
  production_date: string;
  product_type: {
    id: number;
    name: string;
    code: string;
  } | null;
  package_type: {
    id: number;
    name: string;
  } | null;
  storage_type: 'packaged' | 'tank' | 'bulk';
  package_count: number | null;
  weight_per_package: number;
  tank_capacity: number;
  fill_cycles: number | null;
  total_quantity: number;
  status: string;
  created_at: string;
}

// Map vehicle type to match what the page expects
export interface VehicleBooking {
  id: number;
  vehicle_number: string;
  supplier_name: string | null;
  weight_tons: number;
  box_count: number | null;
  actual_box_count: number | null;
  status: string;
  offloading_completed_at: string | null;
  offloading_started_at: string | null;
}

export interface ShiftDetailData {
  shift: ProductionShift | null;
  runs: ProductionRunListItem[];
  outputs: ProductionOutput[];
  vehicles: VehicleBooking[];
  timelineEvents: TimelineEvent[];
  metrics: ShiftMetrics;
  status: 'active' | 'upcoming' | 'completed';
  progress: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  Truck,
  Play,
  CheckCircle,
  Package,
  Droplet,
};

function mapTimelineEvents(events: ShiftTimelineEvent[]): TimelineEvent[] {
  return events.map((event) => ({
    ...event,
    icon: iconMap[event.icon] || Package,
  }));
}

function mapMetrics(metrics: ApiShiftMetrics): ShiftMetrics {
  return {
    fishInputKg: metrics.fish_input_kg,
    fishmealOutputKg: metrics.fishmeal_output_kg,
    fishOilOutputKg: metrics.fish_oil_output_kg,
    vehicleCount: metrics.vehicle_count,
    totalOutputKg: metrics.total_output_kg,
    yieldPercentage: metrics.yield_percentage,
    bagCount: metrics.bag_count,
    tankFills: metrics.tank_fills,
  };
}

export function useShiftDetail(date: string, shiftId: number): ShiftDetailData {
  const {data, isLoading, isError, refetch} = useQuery({
    queryKey: productionRunKeys.shiftDetail(date, shiftId),
    queryFn: async ({signal}) => {
      return productionRunService.getShiftDetails(date, shiftId, {signal});
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  const result = useMemo((): ShiftDetailData => {
    if (!data) {
      return {
        shift: null,
        runs: [],
        outputs: [],
        vehicles: [],
        timelineEvents: [],
        metrics: {
          fishInputKg: 0,
          fishmealOutputKg: 0,
          fishOilOutputKg: 0,
          vehicleCount: 0,
          totalOutputKg: 0,
          yieldPercentage: 0,
          bagCount: 0,
          tankFills: 0,
        },
        status: 'completed',
        progress: 0,
        isLoading,
        isError,
        refetch,
      };
    }

    return {
      shift: data.shift,
      runs: data.runs,
      outputs: data.outputs as ProductionOutput[],
      vehicles: data.vehicles as VehicleBooking[],
      timelineEvents: mapTimelineEvents(data.timeline_events),
      metrics: mapMetrics(data.metrics),
      status: data.status,
      progress: data.progress,
      isLoading,
      isError,
      refetch,
    };
  }, [data, isLoading, isError, refetch]);

  return result;
}
