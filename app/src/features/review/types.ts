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
  fiuStatus: "pending" | "fraud" | "not_fraud"
  fiuNotes?: string | null
  fiuInvestigatedAt?: string | null
  fiuInvestigatedBy?: string | null
  investigator?: {
    id: string
    name: string
    image?: string | null
  } | null
  approver?: {
    id: string
    name: string
    image?: string | null
  } | null
  rejector?: {
    id: string
    name: string
    image?: string | null
  } | null
  findings?: Array<{
    id: string
    content: string
    type: "fiu" | "cap"
    status?: string | null
    createdAt: string
    user: {
      id: string
      name: string
      image?: string | null
      role?: string | null
    }
  }>
}

export type ViewMode = "original" | "text" | "signature"
export type RightTab = "analysis" | "review" | "notes" | "chat"
