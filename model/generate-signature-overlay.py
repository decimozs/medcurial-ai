"""
Synthetic Signature Overlay Pipeline for SSS Medical Certificate (MED-01688)
=============================================================================
Generates N training samples by rendering procedural cursive-font "signatures"
and overlaying them onto the fixed signature bounding box of the blank form
template. Also generates negative (empty) and hard-negative (X-mark / initials)
samples. Outputs images + YOLO-format annotations.

No real personal signatures or real patient data are used anywhere in this
pipeline — all signature text is randomly generated from a fictional name pool.
"""

import os
import random
import string
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import albumentations as A
from faker import Faker

fake = Faker()


def random_signature_name():
    first = fake.first_name()
    last = fake.last_name()
    li = fake.random_uppercase_letter()
    fi = first[0].upper()
    variants = [
        f"{first} {li}.",
        f"{first} {last}",
        f"{fi}. {li}.",
        f"{fi}. {last}",
        f"{first} {li}",
        f"{fi}{li}",
        f"{first}",
        f"{fi}. {last}.",
    ]
    return random.choice(variants)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
TEMPLATE_DIR = "./templates"
FONT_DIR = "fonts"
OUTPUT_DIR = "./dataset/sss-with-signature-overlay"
IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")
LABELS_DIR = os.path.join(OUTPUT_DIR, "labels")
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(LABELS_DIR, exist_ok=True)

TEMPLATE_IMAGES = [
    os.path.join(TEMPLATE_DIR, f)
    for f in os.listdir(TEMPLATE_DIR)
    if f.lower().endswith((".jpg", ".jpeg", ".png"))
]
assert TEMPLATE_IMAGES, "No template images found."

# Bounding box measured on the 2481x3509 reference template (pixels)
# Verified via OCR text-position detection + horizontal ruled-line scan:
# the "SIGNATURE OF ATTENDING PHYSICIAN" ruled line runs x=157-1093 at y=2707,
# with the label text starting at y=2715. Writable area sits just above the line,
# below the end of the certification paragraph (~y=2600).
REF_W, REF_H = 2481, 3509
BBOX_REF = (160, 2610, 1085, 2705)  # x_min, y_min, x_max, y_max

# Wider "safe zone" the signature is allowed to overflow into vertically
# (won't touch the certification paragraph above or the ruled line below).
# Horizontally, this is constrained to the ACTUAL signature field width
# (the ruled line runs x=157-1093, label text x=276-950) -- NOT extended
# toward "DATE ACCOMPLISHED" (which starts at x=1657/66.8%), so left/center/right
# placement stays visually within the physician-signature field itself.
REF_SAFE_X = (165, 1080)
REF_SAFE_Y = (2595, 2703)

FONT_PATHS = [
    os.path.join(FONT_DIR, "AlexBrush-Regular.ttf"),
    os.path.join(FONT_DIR, "Allura-Regular.ttf"),
    os.path.join(FONT_DIR, "GreatVibes-Regular.ttf"),
    os.path.join(FONT_DIR, "DancingScript-VariableFont.ttf"),
]

# Elastic/distortion augmentation to break uniform font look
distort = A.Compose(
    [
        A.ElasticTransform(alpha=40, sigma=6, p=0.9),
        A.Rotate(limit=12, p=0.8, border_mode=0),
        A.Perspective(scale=(0.01, 0.04), p=0.4),
        A.MotionBlur(blur_limit=5, p=0.3),
    ]
)

# Whole-page augmentation to simulate scan variability
page_augment = A.Compose(
    [
        A.Rotate(limit=1.5, p=0.6, border_mode=1),
        A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.7),
        A.GaussNoise(std_range=(0.02, 0.08), p=0.4),
        A.ImageCompression(quality_range=(55, 90), p=0.6),
    ]
)


def render_signature_text(text, font_path, target_h):
    """Render cursive text to a transparent RGBA image sized to target_h."""
    font_size = int(target_h * 1.8)
    font = ImageFont.truetype(font_path, font_size)

    tmp = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    bbox = d.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = int(h * 0.4)

    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)
    ink = random.choice(
        [(10, 10, 40, 255), (5, 5, 5, 255), (20, 20, 90, 255)]
    )  # blue/black ink
    d.text((pad - bbox[0], pad - bbox[1]), text, font=font, fill=ink)

    # Random slight stroke-width variation via blur+threshold trick
    if random.random() < 0.5:
        canvas = canvas.filter(ImageFilter.GaussianBlur(radius=0.4))

    return canvas


def make_signature_stroke(safe_w, safe_h):
    """Generate one synthetic signature RGBA crop, sized up to the safe zone
    (allowed to be larger than the 'typical' box -- some real signatures are
    bold/large and cross the ruled line)."""
    name = random_signature_name()
    font_path = random.choice(FONT_PATHS)

    # Wider range: some small/neat signatures, some large/bold ones
    target_h = int(safe_h * random.uniform(0.35, 1.35))
    sig = render_signature_text(name, font_path, target_h)

    # scale to fit within the safe zone width, not the tight box
    scale = min((safe_w * 0.95) / sig.width, (safe_h * 1.1) / sig.height)
    new_size = (max(1, int(sig.width * scale)), max(1, int(sig.height * scale)))
    sig = sig.resize(new_size, Image.LANCZOS)

    # elastic distortion via albumentations (numpy array, RGBA -> handle alpha separately)
    arr = np.array(sig)
    alpha_ch = (
        (arr[:, :, 3].astype(np.float32) * random.uniform(0.65, 1.0))
        .clip(0, 255)
        .astype(np.uint8)
    )
    aug_rgb = distort(image=arr[:, :, :3])["image"]
    aug_alpha = distort(image=alpha_ch)["image"]
    out = np.dstack([aug_rgb, aug_alpha])
    return Image.fromarray(out, mode="RGBA")


def make_negative_mark(box_w, box_h, kind="empty"):
    """kind: 'empty', 'x_mark', 'initials'"""
    canvas = Image.new("RGBA", (box_w, box_h), (0, 0, 0, 0))
    if kind == "empty":
        return canvas
    d = ImageDraw.Draw(canvas)
    if kind == "x_mark":
        cx, cy = box_w // 2, box_h // 2
        s = min(box_w, box_h) // 4
        d.line(
            [(cx - s, cy - s // 2), (cx + s, cy + s // 2)],
            fill=(10, 10, 10, 255),
            width=5,
        )
        d.line(
            [(cx - s, cy + s // 2), (cx + s, cy - s // 2)],
            fill=(10, 10, 10, 255),
            width=5,
        )
    elif kind == "initials":
        font = ImageFont.truetype(random.choice(FONT_PATHS), int(box_h * 0.6))
        text = f"{random.choice(string.ascii_uppercase)}{random.choice(string.ascii_uppercase)}."
        d.text((box_w * 0.1, box_h * 0.1), text, font=font, fill=(10, 10, 10, 255))
    return canvas


def compute_paste_position(
    position, overlay_w, overlay_h, safe_x_min, safe_x_max, safe_y_min, safe_y_max
):
    """Compute paste (x, y) so the overlay stays within the safe zone,
    biased toward left / center / right as requested."""
    max_paste_x = max(safe_x_min, safe_x_max - overlay_w)
    min_paste_x = safe_x_min

    if position == "left":
        paste_x = min_paste_x + random.randint(
            0, int((max_paste_x - min_paste_x) * 0.08 + 1)
        )
    elif position == "right":
        paste_x = max_paste_x - random.randint(
            0, int((max_paste_x - min_paste_x) * 0.08 + 1)
        )
    else:  # center
        center_x = min_paste_x + (max_paste_x - min_paste_x) // 2
        paste_x = center_x + random.randint(-15, 15)

    paste_x = max(min_paste_x, min(paste_x, max_paste_x))

    max_paste_y = max(safe_y_min, safe_y_max - overlay_h)
    paste_y = random.randint(safe_y_min, max(safe_y_min, max_paste_y))

    return paste_x, paste_y


def generate_sample(idx, kind="signature", position="center"):
    template_path = random.choice(TEMPLATE_IMAGES)
    template = Image.open(template_path).convert("RGB")
    w, h = template.size

    template_aug = A.Compose(
        [
            A.RandomBrightnessContrast(
                brightness_limit=0.12, contrast_limit=0.12, p=0.7
            ),
            A.GaussNoise(std_range=(0.01, 0.05), p=0.5),
            A.ImageCompression(quality_range=(50, 90), p=0.6),
        ]
    )
    arr = np.array(template)
    arr = template_aug(image=arr)["image"]
    template = Image.fromarray(arr)

    sx, sy = w / REF_W, h / REF_H

    x_min, y_min, x_max, y_max = [
        int(v * s) for v, s in zip(BBOX_REF, (sx, sy, sx, sy))
    ]
    box_w, box_h = x_max - x_min, y_max - y_min

    safe_x_min, safe_x_max = [int(v * sx) for v in REF_SAFE_X]
    safe_y_min, safe_y_max = [int(v * sy) for v in REF_SAFE_Y]

    if kind == "signature":
        overlay = make_signature_stroke(
            safe_x_max - safe_x_min, safe_y_max - safe_y_min
        )
        paste_x, paste_y = compute_paste_position(
            position,
            overlay.width,
            overlay.height,
            safe_x_min,
            safe_x_max,
            safe_y_min,
            safe_y_max,
        )
    else:
        overlay = make_negative_mark(box_w, box_h, kind=kind)
        off_x = (
            random.randint(-10, max(10, box_w - overlay.width - 10))
            if overlay.width < box_w
            else 0
        )
        off_y = random.randint(0, max(0, box_h - overlay.height))
        paste_x = x_min + max(0, off_x)
        paste_y = y_min + off_y

    template_rgba = template.convert("RGBA")
    template_rgba.alpha_composite(overlay, (paste_x, paste_y))
    result = template_rgba.convert("RGB")

    # page-level augmentation
    arr = np.array(result)
    arr = page_augment(image=arr)["image"]
    result = Image.fromarray(arr)

    # save image
    tag = f"{kind}_{position}" if kind == "signature" else kind
    fname = f"sample_{idx:05d}_{tag}.jpg"
    result.save(os.path.join(IMAGES_DIR, fname), quality=88)

    # YOLO label (class 0 = signature). Empty file for 'empty' negative.
    label_path = os.path.join(LABELS_DIR, fname.replace(".jpg", ".txt"))
    with open(label_path, "w") as f:
        if kind != "empty":
            xc = (paste_x + overlay.width / 2) / w
            yc = (paste_y + overlay.height / 2) / h
            bw = overlay.width / w
            bh = overlay.height / h
            f.write(f"0 {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}\n")
        # else: empty file, no signature present

    return fname


if __name__ == "__main__":
    N_SIGNATURES_PER_POSITION = 300
    N_EMPTY = 200
    N_XMARK = 150
    N_INITIALS = 150

    idx = 0
    for position in ["left", "center", "right"]:
        for _ in range(N_SIGNATURES_PER_POSITION):
            generate_sample(idx, kind="signature", position=position)
            idx += 1
    for _ in range(N_EMPTY):
        generate_sample(idx, kind="empty")
        idx += 1
    for _ in range(N_XMARK):
        generate_sample(idx, kind="x_mark")
        idx += 1
    for _ in range(N_INITIALS):
        generate_sample(idx, kind="initials")
        idx += 1

    print(f"Done. {idx} samples written to {IMAGES_DIR}")
