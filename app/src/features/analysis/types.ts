export interface FraudScores {
  medical_language?: number
  protocol_adherence?: number
  linguistic_naturalness?: number
  severity_alignment?: number
}

export interface FraudNotes {
  language_note?: string
  protocol_note?: string
  naturalness_note?: string
  severity_note?: string
}

export interface RankingResponse {
  overview?: string
  final_rank?: string
  suspicion_type?: string
  summary_of_evidence?: string
  scores?: FraudScores
  notes?: FraudNotes
}

export interface AuditorResponse {
  final_rank?: string
  suspicion_type?: string
  is_flagged_for_review?: boolean
  verdict?: string
  overall_score?: number
}

export interface FraudDetectorResponse {
  description_score?: number
  assessment?: string
}

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

export interface FraudAnalysisData {
  auditor_response?: string | AuditorResponse | { raw_response?: string }
  ranking_response?: string | RankingResponse
  fraud_detector_response?: string | FraudDetectorResponse
}
