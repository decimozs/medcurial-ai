import cv2
import numpy as np

from app.routers.worker import _extract_signature_crop


def _encode_png(image: np.ndarray) -> bytes:
    ok, buffer = cv2.imencode(".png", image)
    assert ok
    return buffer.tobytes()


def test_extract_signature_crop_uses_detection_overlay_not_full_document():
    original = np.full((500, 350, 3), 255, dtype=np.uint8)
    cv2.putText(
        original,
        "Medical claim document",
        (24, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 0),
        2,
    )
    cv2.putText(
        original,
        "Marlon Martin",
        (95, 395),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 0),
        2,
    )

    visualization = original.copy()
    cv2.rectangle(visualization, (80, 360), (260, 420), (0, 255, 0), 4)

    crop_bytes = _extract_signature_crop(
        _encode_png(original), _encode_png(visualization)
    )

    assert crop_bytes is not None
    crop = cv2.imdecode(np.frombuffer(crop_bytes, np.uint8), cv2.IMREAD_COLOR)
    assert crop is not None
    assert crop.shape[0] < original.shape[0] * 0.35
    assert crop.shape[1] < original.shape[1] * 0.7
