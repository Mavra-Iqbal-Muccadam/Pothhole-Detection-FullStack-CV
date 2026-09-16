# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from pathlib import Path
import uuid
import os
from typing import List

# ---------------------------
# Paths & folders
# ---------------------------
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
PROCESSED_DIR = BASE_DIR / "processed"

UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

# ---------------------------
# Load YOLO model
# ---------------------------
# Make sure best.pt is in the same folder as main.py
MODEL_PATH = BASE_DIR / "best.pt"
if not MODEL_PATH.exists():
    raise RuntimeError(f"Model weights not found at {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))

# ---------------------------
# FastAPI app & CORS
# ---------------------------
app = FastAPI(title="Road Issue Detection API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve processed media (images + videos) at /media/...
app.mount("/media", StaticFiles(directory=str(PROCESSED_DIR)), name="media")


# ---------------------------
# Helper: build summary / severity
# ---------------------------
def build_summary_and_severity(detections: List[dict]):
    """
    detections = [{class_name: str, confidence: float}, ...]
    """
    total = len(detections)
    potholes = sum(1 for d in detections if "pothole" in d["class_name"].lower())
    cracks = sum(1 for d in detections if "crack" in d["class_name"].lower())

    if total == 0:
        return "No potholes or cracks detected.", None

    # Simple severity logic – tune as you like
    if total < 5:
        severity = "low"
    elif total < 15:
        severity = "medium"
    else:
        severity = "high"

    summary_parts = []
    summary_parts.append(f"{total} issues detected in this media.")
    if potholes:
        summary_parts.append(f"Potholes: {potholes}")
    if cracks:
        summary_parts.append(f"Cracks: {cracks}")
    summary = " ".join(summary_parts)

    return summary, severity


# ---------------------------
# Health check
# ---------------------------
@app.get("/")
def root():
    return {"status": "ok", "message": "Road detection API running"}


# ---------------------------
# Image detection endpoint
# ---------------------------
@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    # Save uploaded image
    file_id = uuid.uuid4().hex
    orig_name = file.filename or "image.png"
    ext = os.path.splitext(orig_name)[1] or ".png"
    input_filename = f"{file_id}{ext}"
    input_path = UPLOAD_DIR / input_filename

    with open(input_path, "wb") as f:
        f.write(await file.read())

    # Run YOLO on image and save annotated image
    results = model.predict(
        source=str(input_path),
        save=True,
        project=str(PROCESSED_DIR),
        name="image-outputs",
        exist_ok=True,
        verbose=False,
    )

    r = results[0]
    save_dir = Path(r.save_dir)
    output_path = save_dir / input_filename
    if not output_path.exists():
        # Fallback: pick the most recently modified image in the save_dir
        # (YOLO may change extension when saving.)
        candidates = list(save_dir.glob("*.jpg")) + list(save_dir.glob("*.png"))
        if not candidates:
            # Treat as invalid / non-road image for the frontend UX
            raise HTTPException(
                status_code=400,
                detail="Image is invalid. Please upload a clear image containing visible road damage (potholes or cracks).",
            )
        output_path = max(candidates, key=lambda p: p.stat().st_mtime)

    # Collect detections
    dets: List[dict] = []
    names = r.names  # {cls_id: class_name}
    if r.boxes is not None:
        for box in r.boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())
            class_name = names.get(cls_id, str(cls_id))
            dets.append({
                "class_name": class_name,
                "confidence": conf,
            })

    summary, severity = build_summary_and_severity(dets)

    # Build URL for frontend
    rel_path = output_path.relative_to(PROCESSED_DIR).as_posix()
    processed_image_url = f"http://localhost:8000/media/{rel_path}"

    return {
        "type": "image",
        "processed_image_url": processed_image_url,
        "detections": dets,
        "summary": summary,
        "severity": severity,
    }


# ---------------------------
# Video detection endpoint
# ---------------------------
@app.post("/detect-video")
async def detect_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Please upload a video file")

    # Save uploaded video
    file_id = uuid.uuid4().hex
    orig_name = file.filename or "video.mp4"
    ext = os.path.splitext(orig_name)[1] or ".mp4"
    input_filename = f"{file_id}{ext}"
    input_path = UPLOAD_DIR / input_filename

    with open(input_path, "wb") as f:
        f.write(await file.read())

    # Run YOLO on video and save annotated video
    results = model.predict(
        source=str(input_path),
        save=True,
        project=str(PROCESSED_DIR),
        name="video-outputs",
        exist_ok=True,
        verbose=False,
    )

    # YOLO saves processed video in results[0].save_dir
    first = results[0]
    save_dir = Path(first.save_dir)

    # For consistency with your workflow, only use AVI outputs.
    avi_candidates = list(save_dir.glob("*.avi"))
    if not avi_candidates:
        raise HTTPException(status_code=500, detail="Processed AVI video not found. Ensure YOLO is saving AVI outputs.")

    # Pick the most recently modified AVI so each new request maps to its latest output
    output_path = max(avi_candidates, key=lambda p: p.stat().st_mtime)

    # Collect detections across all frames
    dets: List[dict] = []
    for r in results:
        names = r.names
        if r.boxes is None:
            continue
        for box in r.boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())
            class_name = names.get(cls_id, str(cls_id))
            dets.append({
                "class_name": class_name,
                "confidence": conf,
            })

    summary, severity = build_summary_and_severity(dets)
    total_detections = len(dets)

    # Build URL usable by frontend (will usually be AVI, so shown as download)
    rel_path = output_path.relative_to(PROCESSED_DIR).as_posix()
    processed_video_url = f"http://localhost:8000/media/{rel_path}"

    return {
        "type": "video",
        "processed_video_url": processed_video_url,
        "total_detections": total_detections,
        "detections": dets,
        "summary": summary,
        "severity": severity,
    }
