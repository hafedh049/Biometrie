import api from "./api"

export interface FileUpdateData {
  file_name?: string
}

const FileService = {
  getFiles: async (page = 1, per_page = 10, file_type?: string, partition_id?: string) => {
    try {
      const params = { page, per_page, file_type, partition_id }
      const response = await api.get("/api/files", { params })
      return response.data
    } catch (error) {
      console.error("Error fetching files:", error)
      return { files: [], error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  getFile: async (fileId: string) => {
    try {
      const response = await api.get(`/api/files/${fileId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching file:", error)
      return { file: null, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  uploadFile: async (formData: FormData) => {
    try {
      const response = await api.post("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      console.error("Error uploading file:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  downloadFile: async (fileId: string, fingerprint?: string) => {
    try {
      const params = fingerprint ? { fingerprint } : {}
      const response = await api.get(`/api/files/${fileId}/download`, {
        params,
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url

      // Get filename from header if available
      const contentDisposition = response.headers["content-disposition"]
      let filename = "download"

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1]
        }
      }

      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()

      return response.data
    } catch (error) {
      console.error("Error downloading file:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  updateFile: async (fileId: string, fileData: FileUpdateData) => {
    try {
      const response = await api.put(`/api/files/${fileId}`, fileData)
      return response.data
    } catch (error) {
      console.error("Error updating file:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },

  deleteFile: async (fileId: string) => {
    try {
      const response = await api.delete(`/api/files/${fileId}`)
      return response.data
    } catch (error) {
      console.error("Error deleting file:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  },
}

export default FileService
