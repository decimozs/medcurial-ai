from fastapi import status


class WorkerException(Exception):
    def __init__(
        self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    ):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class InvalidFileTypeError(WorkerException):
    def __init__(self, message: str = "Invalid file type. Only images are allowed."):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)


class ProcessingError(WorkerException):
    def __init__(self, message: str = "Error processing signature"):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExternalAPIError(WorkerException):
    def __init__(self, message: str = "Error communicating with external API"):
        super().__init__(message, status.HTTP_502_BAD_GATEWAY)


class FileSizeExceededError(WorkerException):
    def __init__(self, max_size_mb: int):
        super().__init__(
            f"File size exceeds {max_size_mb}MB limit",
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


class TooManyFilesError(WorkerException):
    def __init__(self, max_count: int):
        super().__init__(
            f"Too many files. Max {max_count} files per request",
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


class ImageDimensionsExceededError(WorkerException):
    def __init__(self, message: str = "Image dimensions exceed allowed limits"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST)
