import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

function extractIdFromUrl(url: string): number | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("road-reports");
    if (idx === -1 || idx + 1 >= parts.length) return null;
    const raw = parts[idx + 1];
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  _ctx: { params: { id: string } }
) {
  const id = extractIdFromUrl(request.url);
  if (id === null) return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  const { data, error } = await supabase
    .from("road_report_responses")
    .select("id, report_id, message, created_at")
    .eq("report_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(
  request: Request,
  _ctx: { params: { id: string } }
) {
  try {
    const id = extractIdFromUrl(request.url);
    if (id === null) {
      return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
    }
    const { message } = await request.json();
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Missing or invalid message" }, { status: 400 });
    }

    // Insert response; expected table schema suggestion below if missing
    const { error } = await supabase
      .from("road_report_responses")
      .insert({ report_id: id, message })
      .select("id")
      .single();

    if (error) {
      const msg = error.message || "Insert failed";
      const hint = msg.includes("relation \"road_report_responses\"")
        ? "Create table road_report_responses(id bigint identity primary key, report_id bigint references road_reports(id) on delete cascade, message text not null, created_at timestamptz default now())"
        : undefined;
      return NextResponse.json({ error: hint ? `${msg}. ${hint}` : msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
