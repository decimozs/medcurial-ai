"""
split_dataset.py
Splits the flat images/ + labels/ output from generate-signature-overlay.py
into train/val/test folders for YOLO training.
"""

import os
import random
import shutil

SOURCE_DIR = "./dataset/sss-with-signature-overlay-cropped"
SOURCE_IMAGES = os.path.join(SOURCE_DIR, "images")
SOURCE_LABELS = os.path.join(SOURCE_DIR, "labels")

DEST_DIR = "./dataset/sss-with-signature-overlay-split"
SPLIT_RATIOS = {"train": 0.8, "val": 0.1, "test": 0.1}

random.seed(42)  # reproducible split


def main():
    all_images = sorted(f for f in os.listdir(SOURCE_IMAGES) if f.endswith(".jpg"))
    random.shuffle(all_images)

    n = len(all_images)
    n_train = int(n * SPLIT_RATIOS["train"])
    n_val = int(n * SPLIT_RATIOS["val"])

    splits = {
        "train": all_images[:n_train],
        "val": all_images[n_train : n_train + n_val],
        "test": all_images[n_train + n_val :],
    }

    for split_name, files in splits.items():
        img_dir = os.path.join(DEST_DIR, split_name, "images")
        lbl_dir = os.path.join(DEST_DIR, split_name, "labels")
        os.makedirs(img_dir, exist_ok=True)
        os.makedirs(lbl_dir, exist_ok=True)

        for fname in files:
            label_fname = fname.replace(".jpg", ".txt")
            shutil.copy(
                os.path.join(SOURCE_IMAGES, fname), os.path.join(img_dir, fname)
            )
            shutil.copy(
                os.path.join(SOURCE_LABELS, label_fname),
                os.path.join(lbl_dir, label_fname),
            )

        print(f"{split_name}: {len(files)} samples")

    print(f"Done. Split dataset written to {DEST_DIR}")


if __name__ == "__main__":
    main()
