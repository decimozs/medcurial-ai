export interface DocumentResponse {
  id: string
  name: string
  status: string
  approvalStatus: "pending" | "approved" | "rejected"
  approvalNotes?: string | null
  createdAt: string
  updatedAt: string
  imageUrls: {
    original?: string
    text_extraction?: string
    signature_extraction?: string
  }
  extractedText?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fraudAnalysis?: any
}

export type ViewMode = "original" | "text" | "signature"
