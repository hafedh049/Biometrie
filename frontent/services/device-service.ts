import api from "./api"

export interface DeviceData {
  device_name: string
  device_description?: string
  device_type: string
  capacity: string
  status?: "active" | "inactive"
}

const DeviceService = {
  getDevices: async (page = 1, per_page = 10, status?: string, device_type?: string) => {
    try {
      const params = { page, per_page, status, device_type }
      const response = await api.get("/api/devices", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching devices:", error)
      return { devices: [], error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  getDevice: async (deviceId: string) => {
    try {
      const response = await api.get(`/api/devices/${deviceId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching device:", error)
      return { device: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  createDevice: async (deviceData: DeviceData) => {
    try {
      const response = await api.post("/api/devices", deviceData)
      return response.data
    } catch (error) {
      console.error("Error creating device:", error)
      return { device: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  updateDevice: async (deviceId: string, deviceData: Partial<DeviceData>) => {
    try {
      const response = await api.put(`/api/devices/${deviceId}`, deviceData)
      return response.data
    } catch (error) {
      console.error("Error updating device:", error)
      return { device: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  deleteDevice: async (deviceId: string) => {
    try {
      const response = await api.delete(`/api/devices/${deviceId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting device:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },
}

export default DeviceService
