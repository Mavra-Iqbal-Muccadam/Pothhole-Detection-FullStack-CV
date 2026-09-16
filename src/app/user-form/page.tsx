"use client";

const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

import { useEffect, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Toast from "@/components/Toast";

export function ReportIssueForm() {
  const [formData, setFormData] = useState({
    road_name: "",
    area: "",
    issues: [],
    description: "",
    image: null as File | null,
    video: null as File | null,
  });

  const [roadOptions, setRoadOptions] = useState<string[]>([]);
  const [areaOptions, setAreaOptions] = useState<Array<{ id: number; area: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: number; road_name: string; area: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);

  // Webcam modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
  type: "image" | "video";
  processedUrl: string | null;
  severity: string | null;
  summary: string | null;
  detections: { class_name: string; confidence: number }[];
} | null>(null);

const [readyToSubmit, setReadyToSubmit] = useState(false);
const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function fetchLocations() {
      const { data, error } = await supabase
        .from("locations")
        .select("id, road_name, area");
      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      const rows = (data || []) as Array<{ id: number; road_name: string; area: string }>;
      setLocations(rows);
      const roads: string[] = [...new Set(rows.map((item) => item.road_name))];
      const areas: Array<{ id: number; area: string }> = rows.map((r) => ({ id: r.id, area: r.area }));

      setRoadOptions(roads);
      setAreaOptions(areas);
      // If a road/area were already chosen (e.g., from prior state), re-evaluate selectedLocId
      if (formData.road_name && formData.area) {
        const loc = rows.find(
          (r) => normalize(r.road_name) === normalize(formData.road_name) && normalize(r.area) === normalize(formData.area)
        );
        setSelectedLocId(loc ? loc.id : null);
      }
    }

    fetchLocations();
  }, []);

  const issueOptions = ["Potholes", "Cracks"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "road_name") {
      // When road changes, reset area and filter area options to only those for the selected road
      const filteredAreas = locations
        .filter((r) => normalize(r.road_name) === normalize(value))
        .map((r) => ({ id: r.id, area: r.area }));
      // De-duplicate by area label
      const seen = new Set<string>();
      const uniqueAreas = filteredAreas.filter((a) => {
        const key = normalize(a.area);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setAreaOptions(uniqueAreas);
      // If only one area matches, auto-select it and compute loc id
      if (uniqueAreas.length === 1) {
        const auto = uniqueAreas[0];
        setFormData({ ...formData, road_name: value, area: auto.area });
        setSelectedLocId(auto.id);
      } else {
        setFormData({ ...formData, road_name: value, area: "" });
        setSelectedLocId(null);
      }
      return;
    }
    if (name === "area") {
      // Here, value is the loc_id string from the select
      const idNum = Number(value);
      setSelectedLocId(Number.isNaN(idNum) ? null : idNum);
      const opt = areaOptions.find((a) => a.id === idNum);
      if (opt) {
        setFormData({ ...formData, area: opt.area });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFormData({ ...formData, [e.target.name]: file });

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      if (e.target.name === "image") {
        setPreviewType("image");
      } else if (e.target.name === "video") {
        setPreviewType("video");
      }
      setAnalyzeMessage(null);
    }
  };

  const toggleIssue = (issue: string) => {
    setFormData((prev: any) => {
      const updated = prev.issues.includes(issue)
        ? prev.issues.filter((i: string) => i !== issue)
        : [...prev.issues, issue];
      return { ...prev, issues: updated };
    });
  };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.road_name || !formData.area) {
      setToast({ type: "error", message: "Please select a road and area" });
      return;
    }
    if (!formData.image && !formData.video) {
      setToast({ type: "error", message: "Please upload an image or video" });
      return;
    }

    try {
      setAnalyzing(true);
      setAnalyzeMessage(null);
      setAnalysis(null);
      setReadyToSubmit(false);

      const analyzeFd = new FormData();
      const isImage = !!formData.image;
      const fileToAnalyze = formData.image ?? formData.video;
      if (fileToAnalyze) {
        analyzeFd.append("file", fileToAnalyze);
      }

      const analyzeUrl = isImage
        ? "http://localhost:8000/detect"
        : "http://localhost:8000/detect-video";

      const analyzeRes = await fetch(analyzeUrl, {
        method: "POST",
        body: analyzeFd,
      });

      if (!analyzeRes.ok) {
        setAnalyzing(false);
        setToast({ type: "error", message: "Failed to analyze media" });
        return;
      }

      const analyzeJson = await analyzeRes.json();

      let hasDetections = false;
      let processedUrl: string | null = null;
      let summary: string | null = null;
      let severity: string | null = null;
      let detections: { class_name: string; confidence: number }[] = [];

      if (isImage) {
        const dets = Array.isArray(analyzeJson?.detections)
          ? analyzeJson.detections
          : [];
        hasDetections = dets.length > 0;
        processedUrl =
          typeof analyzeJson?.processed_image_url === "string"
            ? analyzeJson.processed_image_url
            : null;
        summary =
          typeof analyzeJson?.summary === "string"
            ? analyzeJson.summary
            : null;
        severity =
          typeof analyzeJson?.severity === "string"
            ? analyzeJson.severity
            : null;
        detections = dets.map((d: any) => ({
          class_name: String(d.class_name ?? ""),
          confidence: Number(d.confidence ?? 0),
        }));
      } else {
        const totalDetections =
          typeof analyzeJson?.total_detections === "number"
            ? analyzeJson.total_detections
            : 0;
        hasDetections = totalDetections > 0;

        const dets = Array.isArray(analyzeJson?.detections)
          ? analyzeJson.detections
          : [];

        processedUrl =
          typeof analyzeJson?.processed_video_url === "string"
            ? analyzeJson.processed_video_url
            : null;
        summary =
          typeof analyzeJson?.summary === "string"
            ? analyzeJson.summary
            : null;
        severity =
          typeof analyzeJson?.severity === "string"
            ? analyzeJson.severity
            : null;
        detections = dets.map((d: any) => ({
          class_name: String(d.class_name ?? ""),
          confidence: Number(d.confidence ?? 0),
        }));
      }

      if (!hasDetections) {
        setAnalyzing(false);
        setToast({ type: "error", message: "Upload valid image or video" });
        setAnalyzeMessage(summary || "No potholes or cracks detected.");
        setAnalysis(null);
        setReadyToSubmit(false);
        return;
      }

      // Auto-select issue checkboxes based on detections
      const hasPothole = detections.some((d) => d.class_name.toLowerCase().includes("pothole"));
      const hasCrack = detections.some((d) => d.class_name.toLowerCase().includes("crack"));
      setFormData((prev: any) => {
        const currentIssues: string[] = Array.isArray(prev.issues) ? prev.issues : [];
        const next = new Set<string>(currentIssues);
        if (hasPothole) next.add("Potholes");
        if (hasCrack) next.add("Cracks");
        return { ...prev, issues: Array.from(next) };
      });

      if (processedUrl) {
        setPreviewUrl(processedUrl);
      }
      setAnalyzeMessage(summary || "Potholes or cracks detected.");

      setAnalysis({
        type: isImage ? "image" : "video",
        processedUrl,
        severity,
        summary,
        detections,
      });
      setReadyToSubmit(true);
      setAnalyzing(false);
    } catch (err) {
      console.error("Analyze API error", err);
      setAnalyzing(false);
      setToast({ type: "error", message: "Failed to analyze media" });
      setAnalysis(null);
      setReadyToSubmit(false);
    }
  };

        const submitReportToDb = async () => {
    if (!analysis) {
      setToast({ type: "error", message: "Please analyze media before submitting." });
      return;
    }

    if (!formData.road_name || !formData.area) {
      setToast({ type: "error", message: "Please select a road and area" });
      return;
    }
    if (!formData.image && !formData.video) {
      setToast({ type: "error", message: "Please upload an image or video" });
      return;
    }

    setLoading(true);

    try {
      // Use selectedLocId derived from the area selection
      let locIdToUse = selectedLocId;
      if (!locIdToUse) {
        // Fallback: try server lookup with ilike to tolerate minor formatting differences
        const { data: loc, error: locErr } = await supabase
          .from("locations")
          .select("id")
          .ilike("road_name", formData.road_name)
          .ilike("area", formData.area)
          .maybeSingle();
        if (locErr) {
          console.error("Location lookup error:", locErr);
        }
        if (loc && (loc as any).id) {
          locIdToUse = (loc as any).id as number;
          setSelectedLocId(locIdToUse);
        }
      }

      if (!locIdToUse) {
        setToast({
          type: "error",
          message: "Selected location not found. Please choose a valid Road and Area.",
        });
        setLoading(false);
        return;
      }

      // Plain user description only
      const userDescription = formData.description || "";

      // Split confidences by class (pothole / crack)
      const potholeConfs: number[] = [];
      const crackConfs: number[] = [];

      analysis.detections.forEach((d) => {
        const name = d.class_name.trim().toLowerCase();
        if (name.includes("pothole")) {
          potholeConfs.push(d.confidence);
        } else if (name.includes("crack")) {
          crackConfs.push(d.confidence);
        }
      });

      // Resolve current logged-in user id from localStorage
      let userId: string | null = null;
      const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
      if (raw) {
        try {
          const parsed = JSON.parse(raw as string);
          if (parsed && parsed.id) {
            userId = String(parsed.id);
          }
        } catch {
          userId = null;
        }
      }

      if (!userId) {
        setToast({ type: "error", message: "User session not found. Please log in again." });
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("loc_id", String(locIdToUse));
      fd.append("description", userDescription);
      fd.append("issues", JSON.stringify((formData as any).issues || []));

      // Model metadata fields to match new DB columns
      if (analysis.severity) fd.append("severity", analysis.severity);
      fd.append("pothole_confidences", JSON.stringify(potholeConfs));
      fd.append("crack_confidences", JSON.stringify(crackConfs));

      if (analysis.type === "image" && analysis.processedUrl) {
        fd.append("processed_image_url", analysis.processedUrl);
      }
      if (analysis.type === "video" && analysis.processedUrl) {
        fd.append("processed_video_url", analysis.processedUrl);
      }

      // Attach RAW media (original file)
      if (formData.image) fd.append("image", formData.image);
      if (formData.video) fd.append("video", formData.video);

      // Link report to the logged-in user
      fd.append("user_id", userId);

      const res = await fetch("/api/road-reports", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: json?.error || "Failed to submit report" });
        setLoading(false);
        return;
      }

      setToast({ type: "success", message: "Report submitted successfully" });

      // Reset form + analysis
      setFormData({
        road_name: "",
        area: "",
        issues: [],
        description: "",
        image: null,
        video: null,
      } as any);
      setPreviewUrl(null);
      setPreviewType(null);
      setAnalyzeMessage(null);
      setAnalysis(null);
      setReadyToSubmit(false);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Unexpected error while submitting" });
    }

    setLoading(false);
  };

  // Webcam controls
  const openCamera = async () => {
    try {
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream as any;
        await videoRef.current.play();
      }
    } catch (e) {
      console.error("Camera error", e);
      setToast({ type: "error", message: "Unable to access camera" });
      setCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.png`, { type: "image/png" });
        setFormData((prev: any) => ({ ...prev, image: file }));
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setPreviewType("image");
        setAnalyzeMessage(null);
        setToast({ type: "success", message: "Photo captured" });
      }
      closeCamera();
    }, "image/png");
  };

  return (
    <>
    <form className="space-y-6" onSubmit={handleSubmit}>
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      {/* ROAD DROPDOWN */}
      <div>
        <label className="block font-semibold mb-1 text-[#2A3C24]">
          Road Name
        </label>
        <select
          name="road_name"
          onChange={handleChange}
          disabled={loading}
          className="w-full border border-[#CAD593] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#A1C349] bg-white text-gray-800"
          value={formData.road_name}
        >
          <option value="">Select Road</option>
          {roadOptions.map((road: string, i: number) => (
            <option key={i} value={road}>
              {road}
            </option>
          ))}
        </select>
      </div>

      {/* AREA DROPDOWN */}
      <div>
        <label className="block font-semibold mb-1 text-[#2A3C24]">Area</label>
        <select
          name="area"
          onChange={handleChange}
          disabled={loading}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
          value={selectedLocId ?? ""}
        >
          <option value="">Select Area</option>
          {areaOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.area}
            </option>
          ))}
        </select>
      </div>

      {/* ISSUES CHECKBOX */}
      <div>
        <label className="block font-semibold mb-2 text-[#2A3C24]">
          Issues Found
        </label>
        <div className="grid grid-cols-2 gap-3">
          {issueOptions.map((issue, i) => (
            <label key={i} className="flex items-center gap-2 text-gray-800">
              <input
                type="checkbox"
                checked={(formData as any).issues.includes(issue)}
                onChange={() => toggleIssue(issue)}
                disabled={loading}
              />
              {issue}
            </label>
          ))}
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block font-semibold mb-1 text-[#2A3C24]">
          Description
        </label>
        <textarea
          name="description"
          rows={4}
          onChange={handleChange}
          disabled={loading}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
          placeholder="Describe the road issue..."
        />
      </div>

      {/* IMAGE UPLOAD + CAMERA */}
      <div>
        <label className="block font-semibold mb-2 text-[#2A3C24]">
          Upload Image
        </label>

        <div className="flex gap-3">
          {/* Choose from file */}
          <label className="flex-1 cursor-pointer border border-[#CAD593] rounded-lg p-3 text-center hover:bg-[#CAD593]/20">
            <Upload className="mx-auto mb-1 text-[#2A3C24]" />
            <span className="font-medium text-[#2A3C24]">Upload Image</span>
            <input
              type="file"
              accept="image/*"
              name="image"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Capture with Camera */}
          <button
            type="button"
            onClick={openCamera}
            className="flex-1 border border-[#A1C349] rounded-lg p-3 text-center hover:bg-[#CAD593]/30"
            disabled={loading}
          >
            <Camera className="mx-auto mb-1 text-[#2A3C24]" />
            <span className="font-medium text-[#2A3C24]">Open Camera</span>
          </button>
        </div>
      </div>

      {/* VIDEO UPLOAD */}
      <div>
        <label className="block font-semibold mb-2 text-[#2A3C24]">
          Upload Video
        </label>
        <label className="cursor-pointer border border-[#CAD593] rounded-lg p-3 text-center hover:bg-[#CAD593]/20 block">
          <Upload className="mx-auto mb-1 text-[#2A3C24]" />
          <span className="font-medium text-[#2A3C24]">Upload Video</span>
          <input
            type="file"
            accept="video/*"
            name="video"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

            {/* MEDIA PREVIEW & ANALYZE STATUS */}
      {(previewUrl || analysis?.processedUrl) && (
        <div className="mt-4">
          <label className="block font-semibold mb-2 text-gray-800">Preview</label>
          {/* Prefer processed output if available */}
          {analysis?.type === "image" && analysis.processedUrl && (
            <img
              src={analysis.processedUrl}
              alt="Processed preview"
              className="w-full max-h-80 object-contain border rounded-lg"
            />
          )}
          {analysis?.type === "video" && analysis.processedUrl && (
            <div className="w-full max-h-80 border rounded-lg p-4 bg-gray-50 flex flex-col items-start gap-2">
              <p className="text-sm text-gray-800">
                Processed video is ready. Your browser will download it and you can review detections in your video player.
              </p>
              <a
                href={analysis.processedUrl}
                download
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#2A3C24] text-white text-sm hover:bg-[#1e2a1a]"
              >
                Download processed video
              </a>
            </div>
          )}
          {/* Fallback to raw preview if analysis not yet done */}
          {!analysis && previewType === "image" && previewUrl && (
            <img
              src={previewUrl}
              alt="Selected preview"
              className="w-full max-h-80 object-contain border rounded-lg"
            />
          )}
          {!analysis && previewType === "video" && previewUrl && (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-80 border rounded-lg"
            />
          )}
          {analyzeMessage && (
            <p className="mt-2 text-sm text-gray-700">{analyzeMessage}</p>
          )}

          {/* Detailed analysis is reserved for government dashboard; users only see a brief message above. */}
        </div>
      )}

            {/* ANALYZE BUTTON */}
      <button
        type="submit"
        className={`w-full bg-[#2A3C24] text-white font-semibold py-3 rounded-lg transition ${
          loading || analyzing ? "opacity-70 cursor-not-allowed" : "hover:bg-[#1e2a1a]"
        }`}
        disabled={loading || analyzing}
        aria-busy={loading || analyzing}
      >
        {analyzing ? "Analyzing..." : "Analyze Media"}
      </button>

      {/* CONFIRM & SUBMIT BUTTON (shown after successful analysis) */}
      {analysis && readyToSubmit && (
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className={`mt-3 w-full bg-[#2A3C24] text-white font-semibold py-2 rounded-lg transition ${
            loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#1e2a1a]"
          }`}
          disabled={loading || analyzing}
        >
          {loading ? "Submitting..." : "Submit Complaint to Authorities"}
        </button>
      )}
    </form>

    {/* Webcam Modal */}
    {cameraOpen && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow w-full max-w-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Camera</h4>
            <button onClick={closeCamera} className="text-gray-600 hover:text-gray-900">✕</button>
          </div>
          <div className="relative w-full flex flex-col items-center gap-3">
            <video ref={videoRef} className="w-full max-h-[480px] bg-black rounded" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button onClick={capturePhoto} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Capture</button>
              <button onClick={closeCamera} className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Confirm submission modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-[#2A3C24] mb-2">Confirm Submission</h3>
          <p className="text-sm text-gray-800 mb-4">
            Are you sure you want to submit this complaint to the government authorities?
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-[#2A3C24] text-white hover:bg-[#1e2a1a] text-sm"
              onClick={async () => {
                setShowConfirmModal(false);
                await submitReportToDb();
              }}
            >
              Yes, submit
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function ReportIssuePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          Report Road Issue
        </h1>

        <ReportIssueForm />
      </div>
    </div>
  );
}
