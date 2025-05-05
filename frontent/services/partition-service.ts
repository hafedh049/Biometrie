import api from "./api"

export interface PartitionData {
  partition_name: string
  device_id: string
  format: string
  size: string
  status?: "active" | "inactive"
}

const PartitionService = {
  getPartitions: async (page = 1, per_page = 10, status?: string, format?: string, device_id?: string) => {
    try {
      const params = { page, per_page, status, format, device_id }
      const response = await api.get("/api/partitions", { params })
      return response.data
    } catch (error: any) {
      console.error("Error fetching partitions:", error)
      return { partitions: [], error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  getPartition: async (partitionId: string) => {
    try {
      const response = await api.get(`/api/partitions/${partitionId}`)
      return response.data
    } catch (error: any) {
      console.error("Error fetching partition:", error)
      return { partition: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  createPartition: async (partitionData: PartitionData) => {
    try {
      const response = await api.post("/api/partitions", partitionData)
      return response.data
    } catch (error: any) {
      console.error("Error creating partition:", error)
      return { partition: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  updatePartition: async (partitionId: string, partitionData: Partial<PartitionData>) => {
    try {
      const response = await api.put(`/api/partitions/${partitionId}`, partitionData)
      return response.data
    } catch (error: any) {
      console.error("Error updating partition:", error)
      return { partition: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  deletePartition: async (partitionId: string) => {
    try {
      const response = await api.delete(`/api/partitions/${partitionId}`)
      return response.data
    } catch (error: any) {
      console.error("Error deleting partition:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },
}

export async function fetchPartitions() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/partitions`)
    if (!response.ok) {
      throw new Error(`Error fetching partitions: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching partitions:", error)
    return { partitions: [], error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export default PartitionService
