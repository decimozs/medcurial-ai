export const API_BASE_URL = "http://localhost:3000/api/v1"

export const apiClient = {
  fetch: async (endpoint: string, options: RequestInit = {}) => {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`

    const headers = new Headers(options.headers)
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json")
    }

    return fetch(url, {
      ...options,
      credentials: "include",
      headers,
    })
  },
}
