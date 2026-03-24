export interface FraudAnalysis {
  auditor_response?: {
    is_flagged_for_review: boolean
    analysis_summary?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

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
  fraudAnalysis?: FraudAnalysis
}

export type ViewMode = "original" | "text" | "signature"
export type RightTab = "analysis" | "review" | "notes" | "chat"
