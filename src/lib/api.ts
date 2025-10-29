import axios from "axios"
import { toast } from "sonner"

// Laravel API base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Important for Laravel Sanctum
})

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore cancelled requests (from AbortController)
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    // Extract error message from response
    let errorMessage = "An error occurred. Please try again."

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.error) {
      // Handle Laravel API error format
      errorMessage = error.response.data.error
    } else if (error.response?.data?.errors) {
      // Handle Laravel validation errors
      const errors = error.response.data.errors
      const firstError = Object.values(errors)[0]
      errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
    } else if (error.message) {
      errorMessage = error.message
    }

    // Show toast notification for all errors except 401 (handled separately)
    if (error.response?.status !== 401) {
      toast.error(errorMessage, {
        duration: 4000,
      })
    }

    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem("auth_token")
      toast.error("Session expired. Please login again.")
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)
