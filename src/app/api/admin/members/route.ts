import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FeedbackFormData } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || "synapse2026";

    // Verify admin password securely
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ success: false, error: "Server database configuration missing" }, { status: 500 });
    }

    // Create a Supabase client using the SERVICE ROLE KEY
    // This securely bypasses Row Level Security (RLS) only for this specific admin route
    const supabaseAdmin = createClient(url, serviceKey);

    const { data, error } = await supabaseAdmin
      .from("orientation_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as FeedbackFormData[] });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Unexpected server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { password, uid, deleteAll } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || "synapse2026";

    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ success: false, error: "Server database configuration missing" }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceKey);

    if (deleteAll) {
      const { error } = await supabaseAdmin
        .from("orientation_feedback")
        .delete()
        .not("uid", "is", null);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "All records deleted." });
    }

    if (uid) {
      const { error } = await supabaseAdmin
        .from("orientation_feedback")
        .delete()
        .eq("uid", uid);

      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: `Record ${uid} deleted.` });
    }

    return NextResponse.json({ success: false, error: "No target specified for deletion" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Unexpected server error" }, { status: 500 });
  }
}
