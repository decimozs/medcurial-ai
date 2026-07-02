export interface SignatureVerificationResult {
  status:
    | "pending"
    | "verified"
    | "mismatch"
    | "needs_review"
    | "failed"
    | "no_verified_signature"
  expectedSignatureId: string
  expectedSignatoryName: string
  comparedAt: string
  score: number
  threshold: number
  matchedReferenceUrl: string
  extractedSignatureUrl: string
  overlayUrl?: string
  notes?: string
  error?: string
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
    signature_crop?: string
  }
  extractedText?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fraudAnalysis?: any
  signatureVerification?: SignatureVerificationResult
  fiuStatus: "pending" | "fraud" | "not_fraud"
  fiuNotes?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
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
