"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, FileText, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReportIssueForm } from "@/app/user-form/page";
import { supabase } from "@/lib/supabaseClient";

type UserReport = {
  id: number;
  loc_id: number;
  status: string | null;
  created_at: string;
  description: string | null;
  latest_response?: string | null;
};

export default function UserDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    pending: 0,
  });
  const [issues, setIssues] = useState<UserReport[]>([]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null;
    if (!raw) return;

    let userId: string | null = null;
    try {
      const parsed = JSON.parse(raw);
      userId = parsed?.id || null;
    } catch {
      userId = null;
    }

    if (!userId) return;

    (async () => {
      const { data, error } = await supabase
        .from("road_reports")
        .select("id, loc_id, status, created_at, description")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("User dashboard fetch error:", error);
        return;
      }

      let rows = (data || []) as UserReport[];
      const total = rows.length;
      const resolved = rows.filter(
        (r) => r.status === "done" || r.status === "resolved"
      ).length;
      const inProgress = rows.filter(
        (r) => r.status === "working" || r.status === "in_progress"
      ).length;
      const pending = total - resolved - inProgress;

      // Enrich with latest response from government, if any
      const ids = rows.map((r) => r.id);
      if (ids.length > 0) {
        const { data: respData, error: respErr } = await supabase
          .from("road_report_responses")
          .select("report_id, message, created_at")
          .in("report_id", ids)
          .order("created_at", { ascending: false });

        if (respErr) {
          console.error("User dashboard responses fetch error:", respErr);
        } else if (respData && respData.length > 0) {
          const latestByReport = new Map<number, string>();
          (respData as any[]).forEach((r) => {
            const rid = r.report_id as number;
            if (!latestByReport.has(rid)) {
              latestByReport.set(rid, r.message as string);
            }
          });
          rows = rows.map((r) => ({
            ...r,
            latest_response: latestByReport.get(r.id) ?? null,
          }));
        }
      }

      setStats({ total, resolved, inProgress, pending });
      setIssues(rows.slice(0, 5));
    })();
  }, []);

  const statCards = [
    { label: "Total Reports", value: stats.total, icon: FileText, color: "text-blue-600" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-green-600" },
    { label: "In Progress", value: stats.inProgress, icon: Activity, color: "text-amber-600" },
    { label: "Pending", value: stats.pending, icon: Clock3, color: "text-gray-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD593] via-white to-[#A1C349] p-6">
      <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A3C24]">User Dashboard</h1>
          <p className="text-sm text-gray-700">Submit and track your road issue reports.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-[#CAD593]/60">
          <h2 className="text-xl font-bold text-[#2A3C24]">Report an Issue</h2>
          <p className="text-gray-700 mb-4">Submit details about road conditions in your area.</p>
          <ReportIssueForm />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-4 flex items-center gap-3 border border-[#CAD593]/60">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <div className="text-sm text-gray-600">{s.label}</div>
                  <div className="text-xl font-semibold text-gray-900">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
              <p className="text-sm text-gray-600">Overview of your submitted issues and their status.</p>
            </div>
            <ul className="divide-y">
              {issues.map((item) => {
                const status = item.status || "Unspecified";
                const statusClass =
                  status === "done" || status === "resolved"
                    ? "bg-green-100 text-green-700"
                    : status === "working" || status === "in_progress"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700";

                const title = item.description && item.description.trim().length > 0
                  ? item.description
                  : `Report #${item.id}`;

                return (
                  <li key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{title}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                      {item.latest_response && (
                        <div className="mt-1 text-xs text-gray-700">
                          Govt response: {item.latest_response}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
