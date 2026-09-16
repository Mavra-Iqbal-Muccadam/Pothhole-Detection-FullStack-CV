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
  if (id === null) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("road_reports")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  return NextResponse.json({ status: (data as any).status ?? null });
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
    const { status } = await request.json();
    if (typeof status !== "string") {
      return NextResponse.json({ error: "Missing or invalid status" }, { status: 400 });
    }

    const { error } = await supabase
      .from("road_reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      const msg = error.message || "Update failed";
      const hint = msg.includes("column \"status\"")
        ? "Table road_reports is missing column 'status'. Add it or adjust the API."
        : undefined;
      return NextResponse.json({ error: hint ? `${msg}. ${hint}` : msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
