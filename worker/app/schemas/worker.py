from typing import Any

from pydantic import BaseModel


class CaptureVectorData(BaseModel):
    signatory_name: str
    signature_id: str
    image_urls: dict[str, list[str]]


class CaptureVectorResponse(BaseModel):
    success: bool
    message: str
    data: CaptureVectorData


class DocumentAnalysisResult(BaseModel):
    image_index: int
    document_url: str | None = None
    processed_urls: dict[str, str] | None = None
    result: dict[str, Any] | None = None
    document_id: str | None = None
    error: str | None = None


class DocumentAnalysisResponse(BaseModel):
    success: bool
    message: str
    data: list[DocumentAnalysisResult] | None = None


class SignatureVerificationRequest(BaseModel):
    document_id: str
    signature_id: str


class SignatureVerificationResult(BaseModel):
    status: str
    expectedSignatureId: str
    expectedSignatoryName: str
    comparedAt: str
    score: float
    threshold: float
    matchedReferenceUrl: str
    extractedSignatureUrl: str
    overlayUrl: str | None = None
    notes: str | None = None
    error: str | None = None


class SignatureVerificationResponse(BaseModel):
    success: bool
    message: str
    data: SignatureVerificationResult | None = None
