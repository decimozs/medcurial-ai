.PHONY: generate split train predict all clean help

PROJECT_DIR := $(CURDIR)

help:
	@echo "Available targets:"
	@echo "  make generate  - generate the synthetic signature dataset"
	@echo "  make generate-crop - generate the synthetic cropped signature dataset"
	@echo "  make split     - split dataset into train/val/test"
	@echo "  make train     - train YOLO model"
	@echo "  make predict   - run inference on all images in real_test_samples/"
	@echo "  make all       - generate -> split -> train"
	@echo "  make clean     - remove generated datasets"

generate:
	uv run generate-signature-overlay.py

generate-crop:
	uv run generate-signature-overlay-cropped.py

split:
	uv run split-dataset.py

train:
	uv run yolo detect train \
		data=data.yaml \
		model=yolov8s.pt \
		epochs=100 \
		imgsz=960 \
		batch=8 \
		rect=True \
		project=$(PROJECT_DIR)/runs/detect \
		name=train \
		exist_ok=True

predict:
	uv run yolo detect predict \
		model=$(PROJECT_DIR)/runs/detect/train/weights/best.pt \
		source=$(PROJECT_DIR)/real_test_samples \
		project=$(PROJECT_DIR)/runs/detect \
		name=predict \
		exist_ok=True \
		save=True \
		save_txt=True \
		save_conf=True \
		conf=0.4

crop-real:
	uv run crop_real_samples.py

predict-crop-real:
	uv run yolo detect predict \
		model=$(PROJECT_DIR)/runs/detect/train/weights/best.pt \
		source=$(PROJECT_DIR)/real_test_samples_cropped \
		project=$(PROJECT_DIR)/runs/detect \
		name=predict \
		exist_ok=True \
		save=True \
		save_txt=True \
		save_conf=True \
		conf=0.4

all: generate split train

clean:
	rm -rf dataset/sss-with-signature-overlay
	rm -rf dataset/sss-with-signature-overlay-split
	rm -rf dataset/sss-with-signature-overlay-cropped
	rm -rf runs
