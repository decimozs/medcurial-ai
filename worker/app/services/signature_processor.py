import base64
from typing import Any, Dict

import cv2
import numpy as np
from loguru import logger

TARGET_SIZE = (220, 155)


class SignatureProcessor:
    def __init__(self, image_bytes: bytes) -> None:
        logger.debug("SignatureProcessor: initializing")
        self.raw_image: np.ndarray = self._decode(image_bytes)

    def _decode(self, image_bytes: bytes) -> np.ndarray:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            logger.error("Could not decode image")
            raise ValueError("Could not decode image. Ensure valid format.")
        logger.debug("Image decoded successfully")
        return image

    def _apply_grayscale(self, image: np.ndarray) -> np.ndarray:
        if len(image.shape) < 3:
            return image
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    def _apply_blur(
        self, image: np.ndarray, kernel_size: tuple[int, int] = (3, 3)
    ) -> np.ndarray:
        return cv2.GaussianBlur(image, kernel_size, 0)

    def _apply_threshold(self, image: np.ndarray) -> np.ndarray:
        return cv2.adaptiveThreshold(
            image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 4
        )

    def _apply_morphology(self, image: np.ndarray) -> np.ndarray:
        open_kernel = np.ones((2, 2), np.uint8)
        opened = cv2.morphologyEx(image, cv2.MORPH_OPEN, open_kernel, iterations=1)

        close_kernel = np.ones((3, 3), np.uint8)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, close_kernel, iterations=1)

        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
            closed, connectivity=8
        )

        cleaned_binary = np.zeros_like(closed)
        for j in range(1, num_labels):
            if stats[j, cv2.CC_STAT_AREA] > 60:
                cleaned_binary[labels == j] = 255

        return cleaned_binary

    def _extract_valid_contours(self, closing_image: np.ndarray) -> list[Any]:
        contours, _ = cv2.findContours(
            closing_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        if not contours:
            return []

        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        min_area_threshold = cv2.contourArea(contours[0]) * 0.05
        return [c for c in contours if cv2.contourArea(c) > min_area_threshold]

    def _prepare_siamese(
        self, image: np.ndarray, target_size: tuple[int, int] = TARGET_SIZE
    ) -> np.ndarray:
        if image is None:
            logger.error("Input image is None")
            raise ValueError("Input image is None.")

        h, w = image.shape[:2]
        scale = min(target_size[0] / w, target_size[1] / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

        canvas = np.zeros((target_size[1], target_size[0]), dtype=np.uint8)
        x_offset = (target_size[0] - new_w) // 2
        y_offset = (target_size[1] - new_h) // 2
        canvas[y_offset : y_offset + new_h, x_offset : x_offset + new_w] = resized
        return canvas

    def _encode_image(self, image_np: np.ndarray) -> str:
        if image_np is None:
            return ""
        _, buffer = cv2.imencode(".png", image_np)
        return base64.b64encode(buffer).decode("utf-8")

    def _run_pipeline(self, image_data: np.ndarray) -> np.ndarray:
        grayscale = self._apply_grayscale(image_data)
        blurred = self._apply_blur(grayscale)
        thresholded = self._apply_threshold(blurred)
        morphed = self._apply_morphology(thresholded)
        return morphed

    def get_visualization(self) -> np.ndarray:
        orig_rgb = cv2.cvtColor(self.raw_image, cv2.COLOR_BGR2RGB)
        closing = self._run_pipeline(self.raw_image)
        valid_contours = self._extract_valid_contours(closing)

        visualization = orig_rgb.copy()
        if valid_contours:
            cv2.drawContours(visualization, valid_contours, -1, (0, 255, 0), 2)
            all_points = np.vstack(valid_contours)
            x, y, w, h = cv2.boundingRect(all_points)
            cv2.rectangle(visualization, (x, y), (x + w, y + h), (255, 0, 0), 2)

        return visualization

    def process(self) -> Dict[str, str]:
        logger.info("Starting signature processing pipeline")
        closing = self._run_pipeline(self.raw_image)
        valid_contours = self._extract_valid_contours(closing)

        try:
            roi = self.get_visualization()
            if roi is None or roi.size == 0:
                logger.warning("ROI visualization empty, using raw image")
                roi = self.raw_image
        except Exception as e:
            logger.warning("ROI visualization failed: {}", e)
            roi = self.raw_image

        normalized = siamese = image_preview = closing

        if valid_contours:
            all_points = np.vstack(valid_contours)
            x, y, w, h = cv2.boundingRect(all_points)

            img_h, img_w = closing.shape[:2]
            y1, y2 = max(0, y - 25), min(img_h, y + h + 25)
            x1, x2 = max(0, x - 25), min(img_w, x + w + 25)

            roi_cropped = closing[y1:y2, x1:x2]
            normalized = self._prepare_siamese(roi_cropped)
            siamese = self._prepare_siamese(roi_cropped)
            image_preview = cv2.bitwise_not(siamese)
            logger.info(
                "Processing complete: {} contours found, ROI size {}x{}",
                len(valid_contours),
                x2 - x1,
                y2 - y1,
            )
        else:
            logger.warning("No valid contours found, using raw image")

        return {
            "roi": self._encode_image(roi),
            "normalized": self._encode_image(normalized),
            "siamese": self._encode_image(siamese),
            "image_preview": self._encode_image(image_preview),
        }
