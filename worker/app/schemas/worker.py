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
