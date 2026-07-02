"""
crop_real_samples.py
Applies the same certification-ROI crop used in training to real photos,
so inference sees the same kind of input the model was trained on.
"""

import os
from PIL import Image

SOURCE_DIR = "./real_test_samples"
DEST_DIR = "./real_test_samples_cropped"

REF_W, REF_H = 2481, 3509
CROP_REF = (50, 2500, 2430, 3150)  # same as generate-signature-overlay-cropped.py

os.makedirs(DEST_DIR, exist_ok=True)

x1_pct = CROP_REF[0] / REF_W
y1_pct = CROP_REF[1] / REF_H
x2_pct = CROP_REF[2] / REF_W
y2_pct = CROP_REF[3] / REF_H

for fname in os.listdir(SOURCE_DIR):
    if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
        continue
    im = Image.open(os.path.join(SOURCE_DIR, fname)).convert("RGB")
    w, h = im.size
    crop = im.crop((int(w * x1_pct), int(h * y1_pct), int(w * x2_pct), int(h * y2_pct)))
    crop.save(os.path.join(DEST_DIR, fname))
    print(f"Cropped {fname} -> {crop.size}")

print(f"Done. Cropped images written to {DEST_DIR}")
