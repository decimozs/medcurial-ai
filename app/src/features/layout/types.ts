export interface DocumentThumbnail {
  id: string
  name: string
  status: string
  createdAt: string
  imageUrls: {
    original?: string
    text_extraction?: string
    signature_extraction?: string
    signature_crop?: string
  }
}

export interface SignatureThumbnail {
  id: string
  name: string
  status: string
  imageUrls: { image_preview: string[] }
  no: string
}
