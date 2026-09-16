"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Toast from "@/components/Toast";
import { AlertTriangle, ArrowLeft, Loader2, MapPin, Play, Video } from "lucide-react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

type Report = {
  id: number;
  loc_id: number;
  issues: string[] | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  processed_image_url: string | null;
  processed_video_url: string | null;
  created_at: string;
  status?: string | null;
  severity?: string | null;
  pothole_confidences?: number[] | null;
  crack_confidences?: number[] | null;
};
type LocationRow = { id: number; road_name: string; area: string };

type ResponseRow = { id: number; report_id: number; message: string; created_at: string };

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = (params as any)?.id as string | string[] | undefined;
  const reportId = (() => {
    const v = Array.isArray(rawId) ? rawId[0] : rawId;
    if (typeof v !== "string") return NaN;
    const idNum = parseInt(v.trim(), 10);
    return Number.isFinite(idNum) ? idNum : NaN;
  })();

  const [report, setReport] = useState<Report | null>(null);
  const [location, setLocation] = useState<LocationRow | null>(null);
  const [related, setRelated] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [status, setStatus] = useState<string>("");
  const [responseText, setResponseText] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      // Load report
            const { data: r, error: repErr } = await supabase
        .from("road_reports")
        .select(
          "id, loc_id, issues, description, image_url, video_url, processed_image_url, processed_video_url, created_at, status, severity, pothole_confidences, crack_confidences"
        )
        .eq("id", reportId)
        .maybeSingle();
      if (repErr) console.error(repErr);
      if (!mounted) return;
      setReport((r as any) || null);
      setStatus((r as any)?.status || "");
      // Load location
      if (r?.loc_id) {
        const { data: loc } = await supabase
          .from("locations")
          .select("id, road_name, area")
          .eq("id", r.loc_id)
          .maybeSingle();
        setLocation((loc as any) || null);
        // Load related reports from same location (excluding current)
                const { data: rel } = await supabase
          .from("road_reports")
          .select(
            "id, loc_id, issues, description, image_url, video_url, processed_image_url, processed_video_url, created_at"
          )
          .eq("loc_id", r.loc_id)
          .neq("id", reportId)
          .order("created_at", { ascending: false })
          .limit(6);
        setRelated((rel as any) || []);
      }
      setLoading(false);
    };
    if (!Number.isNaN(reportId)) load();
    return () => {
      mounted = false;
    };
  }, [reportId]);

  const topAlert = useMemo(() => {
    // Simple attention banner if there are >= 5 reports for this location in related + current
    const count = (related?.length || 0) + (report ? 1 : 0);
    return count >= 5;
  }, [related, report]);

  const analysisSummary = useMemo(() => {
    if (!report) return null;

    const potholes = report.pothole_confidences?.length ?? 0;
    const cracks = report.crack_confidences?.length ?? 0;
    const total = potholes + cracks;

    if (total === 0 && !report.severity) return null;

    const sev = report.severity || "unspecified";

    const avg = (arr: number[] | null | undefined) => {
      if (!arr || arr.length === 0) return null;
      const sum = arr.reduce((acc, v) => acc + v, 0);
      return (sum / arr.length) * 100;
    };

    const avgPothole = avg(report.pothole_confidences);
    const avgCrack = avg(report.crack_confidences);

    let sentence = "";
    if (total > 0) {
      sentence += `Automated analysis detected ${total} issue${total === 1 ? "" : "s"} in this media`;
      const parts: string[] = [];
      if (potholes > 0) parts.push(`${potholes} pothole-related`);
      if (cracks > 0) parts.push(`${cracks} crack-related`);
      if (parts.length) sentence += `, including ${parts.join(" and ")}`;
      sentence += ". ";
    }

    sentence += `Overall severity has been classified as "${sev}" based on the detected pattern of damage.`;

    if (avgPothole !== null || avgCrack !== null) {
      const detailParts: string[] = [];
      if (avgPothole !== null) detailParts.push(`pothole detections (${avgPothole.toFixed(1)}% average confidence)`);
      if (avgCrack !== null) detailParts.push(`crack detections (${avgCrack.toFixed(1)}% average confidence)`);
      sentence += ` The model is particularly confident about ${detailParts.join(" and ")}.`;
    }

    return sentence;
  }, [report]);

  useEffect(() => {
    if (!report) return;
    if (!chartRef.current) return;

    const potholes = report.pothole_confidences?.length ?? 0;
    const cracks = report.crack_confidences?.length ?? 0;
    const total = potholes + cracks;
    if (total === 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
      return;
    }

    const data = {
      labels: ["Potholes", "Cracks"],
      datasets: [
        {
          data: [potholes, cracks],
          backgroundColor: ["#A1C349", "#2A3C24"],
          borderColor: "#F5F7F0",
          borderWidth: 1,
        },
      ],
    };

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = data as any;
      chartInstanceRef.current.update();
      return;
    }

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: "doughnut",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#374151",
              font: { size: 12 },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [report]);

  const submitStatus = async () => {
    if (Number.isNaN(reportId)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/road-reports/${reportId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: json?.error || "Failed to update status" });
      } else {
        setToast({ type: "success", message: "Status updated" });
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", message: "Unexpected error updating status" });
    }
    setSaving(false);
  };

  const submitResponse = async () => {
    if (!responseText.trim()) return;
    if (Number.isNaN(reportId)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/road-reports/${reportId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: responseText.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast({ type: "error", message: json?.error || "Failed to add response" });
      } else {
        setToast({ type: "success", message: "Response added" });
        setResponseText("");
      }
    } catch (e) {
      console.error(e);
      setToast({ type: "error", message: "Unexpected error adding response" });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD593] via-white to-[#A1C349] p-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#2A3C24] hover:underline flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Back</button>
        </div>

        {loading || !report ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-600 border border-[#CAD593]/60">
            <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading report...
          </div>
        ) : (
          <>
            {topAlert && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                High activity from this location. Prioritize review.
              </div>
            )}

            {/* Main media area */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow p-4 border border-[#CAD593]/60">
                                <div className="aspect-video bg-black rounded flex items-center justify-center overflow-hidden p-2">
                  {report.processed_video_url ? (
                    report.processed_video_url.toLowerCase().endsWith(".avi") ? (
                      <div className="text-center text-sm text-gray-100 space-y-2">
                        <p>Processed evidence video is available as an AVI file for offline review.</p>
                        <a
                          href={report.processed_video_url}
                          download
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#CAD593] text-[#2A3C24] text-xs font-semibold hover:bg-white"
                        >
                          Download processed video
                        </a>
                      </div>
                    ) : (
                      <video src={report.processed_video_url} controls autoPlay className="w-full h-full object-contain" />
                    )
                  ) : report.processed_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={report.processed_image_url} alt="evidence" className="w-full h-full object-contain" />
                  ) : report.video_url ? (
                    report.video_url.toLowerCase().endsWith(".avi") ? (
                      <div className="text-center text-sm text-gray-100 space-y-2">
                        <p>Evidence video is available as an AVI file for offline review.</p>
                        <a
                          href={report.video_url}
                          download
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#CAD593] text-[#2A3C24] text-xs font-semibold hover:bg-white"
                        >
                          Download video
                        </a>
                      </div>
                    ) : (
                      <video src={report.video_url} controls autoPlay className="w-full h-full object-contain" />
                    )
                  ) : report.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={report.image_url} alt="evidence" className="w-full h-full object-contain" />
                  ) : (
                    <Video className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-sm text-gray-600">{new Date(report.created_at).toLocaleString()}</div>
                  <div className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-[#2A3C24]" />
                    {location?.road_name} • {location?.area}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-4 space-y-4 border border-[#CAD593]/60">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div className="flex gap-2">
                    <select className="border border-[#CAD593] rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#A1C349]" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="">Unspecified</option>
                      <option value="working">Working</option>
                      <option value="done">Done</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                    <button onClick={submitStatus} disabled={saving} className={`px-3 py-2 rounded-lg text-white ${saving ? "bg-[#A1C349] opacity-70" : "bg-[#2A3C24] hover:bg-[#1e2a1a]"}`}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Response</div>
                  <textarea className="w-full border border-[#CAD593] rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#A1C349]" rows={4} placeholder="Write a response..." value={responseText} onChange={(e) => setResponseText(e.target.value)} />
                  <div className="mt-2 flex justify-end">
                    <button onClick={submitResponse} disabled={saving || !responseText.trim()} className={`px-3 py-2 rounded-lg text-white ${saving || !responseText.trim() ? "bg-gray-300" : "bg-[#2A3C24] hover:bg-[#1e2a1a]"}`}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side related media */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl shadow p-4 border border-[#CAD593]/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900 flex items-center gap-2"><Play className="w-4 h-4" /> Related from this location</div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  {related.slice(0, 6).map((r) => (
                    <div key={r.id} className="aspect-video bg-black rounded overflow-hidden">
                                            {r.processed_video_url ? (
                        <video src={r.processed_video_url} controls muted className="w-full h-full object-cover" />
                      ) : r.processed_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.processed_image_url} alt="related" className="w-full h-full object-cover" />
                      ) : r.video_url ? (
                        <video src={r.video_url} controls muted className="w-full h-full object-cover" />
                      ) : r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt="related" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description & issues */}
            <div className="bg-white rounded-xl shadow p-6 border border-[#CAD593]/60 space-y-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">Details</div>
                <div className="mt-2 text-gray-800 whitespace-pre-wrap">{report.description || "No description"}</div>
                {!!(report.issues && report.issues.length) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {report.issues.map((iss, i) => (
                      <span key={i} className="text-xs bg-[#CAD593]/40 text-[#2A3C24] border border-[#CAD593] px-2 py-0.5 rounded-full">{iss}</span>
                    ))}
                  </div>
                )}
              </div>

              {analysisSummary && (
                <div className="mt-4 grid md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2">
                    <div className="text-sm font-semibold text-gray-900 mb-1">Automated analysis</div>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {analysisSummary}
                    </p>
                  </div>
                  <div className="h-32">
                    <canvas ref={chartRef} className="w-full h-full" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
