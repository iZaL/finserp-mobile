import { api } from "@/lib/api"

export interface EmployeeCountResponse {
  total: number
  active: number
  inactive: number
}

export const employeeService = {
  // Get total employee count
  getCount: async (): Promise<EmployeeCountResponse> => {
    const response = await api.get<EmployeeCountResponse>("/employees/count")
    return response.data
  },
}
