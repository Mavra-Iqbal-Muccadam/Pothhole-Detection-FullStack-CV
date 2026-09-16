import os
import uuid
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import cv2

# ========= PATHS & FOLDERS =========
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")  # using your file as-is

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ========= FASTAPI APP =========
app = FastAPI(title="Road Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# serve all files under /outputs (images + videos)
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

# ========= LOAD MODEL (no assumptions about classes) =========
model = YOLO(MODEL_PATH)
CLASS_NAMES = model.names  # comes from your best.pt


def compute_severity_from_count(total: int) -> str:
    """Simple generic severity based only on total detections."""
    if total == 0:
        return "low"
    if total < 3:
        return "medium"
    return "high"


# ========= IMAGE ENDPOINT =========
@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    # basic extension check (still allowed if name weird)
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    temp_name = f"img_{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(OUTPUT_DIR, temp_name)

    # save uploaded file
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)

    # run model on image
    results = model.predict(temp_path)
    res = results[0]

    # collect detections (generic, no class assumptions)
    detections: List[dict] = []
    for box in res.boxes:
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        class_name = CLASS_NAMES.get(cls_id, str(cls_id)) if isinstance(CLASS_NAMES, dict) else str(cls_id)

        detections.append(
            {
                "class_id": cls_id,
                "class_name": class_name,
                "confidence": conf,
            }
        )

    # draw boxes and save annotated image
    plotted = res.plot()  # BGR numpy array
    out_name = f"img_out_{uuid.uuid4().hex}.jpg"
    out_path = os.path.join(OUTPUT_DIR, out_name)
    cv2.imwrite(out_path, plotted)

    total = len(detections)
    severity = compute_severity_from_count(total)

    summary = (
        "No objects detected."
        if total == 0
        else f"{total} objects detected by the model."
    )

    processed_image_url = f"http://localhost:8000/outputs/{out_name}"

    return {
        "type": "image",
        "processed_image_url": processed_image_url,
        "detections": detections,
        "severity": severity,
        "summary": summary,
    }


# ========= VIDEO ENDPOINT (.mp4) =========
@app.post("/detect-video")
async def detect_video(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in [".mp4"]:
        raise HTTPException(status_code=400, detail="Only .mp4 video files are allowed.")

    temp_name = f"vid_{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(OUTPUT_DIR, temp_name)

    # save uploaded video
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)

    # unique run folder for this video output
    run_name = f"run_{uuid.uuid4().hex}"

    # run model on video, let Ultralytics save annotated video
    results = model.predict(
        source=temp_path,
        save=True,
        project=OUTPUT_DIR,
        name=run_name,
    )

    run_dir = os.path.join(OUTPUT_DIR, run_name)
    if not os.path.isdir(run_dir):
        raise HTTPException(status_code=500, detail="Processed video folder not found.")

    # try to find the annotated video file inside run_dir
    out_video_path = None
    for fname in os.listdir(run_dir):
        if fname.lower().endswith(".mp4"):
            out_video_path = os.path.join(run_dir, fname)
            break

    if out_video_path is None:
        raise HTTPException(status_code=500, detail="Processed video file not found.")

    # simple stats (generic)
    total_frames = 0
    total_detections = 0
    frames_with_detections = 0

    for r in results:
        total_frames += 1
        n = len(r.boxes)
        total_detections += n
        if n > 0:
            frames_with_detections += 1

    severity = compute_severity_from_count(total_detections)

    processed_video_rel = os.path.relpath(out_video_path, OUTPUT_DIR).replace("\\", "/")
    processed_video_url = f"http://localhost:8000/outputs/{processed_video_rel}"

    summary = (
        "No objects detected in the video."
        if total_detections == 0
        else f"{total_detections} total detections across {total_frames} frames."
    )

    return {
        "type": "video",
        "processed_video_url": processed_video_url,
        "total_frames": total_frames,
        "total_detections": total_detections,
        "frames_with_detections": frames_with_detections,
        "severity": severity,
        "summary": summary,
    }
