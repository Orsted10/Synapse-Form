import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-project-url-here") {
    console.warn(
      "Supabase credentials not configured. Form submissions will be logged to console instead."
    );
    return null;
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export interface FeedbackFormData {
  full_name: string;
  uid: string;
  branch: string;
  section: string;
  session_rating: number; // 1-5
  favorite_part: string;
  informative_rating: string;
  engaging_rating: number; // 1-5
  motivation_level: string;
  event_preferences: string[];
  become_member: string;
  suggestions: string;
  created_at?: string;
}

export async function submitFeedbackForm(
  data: FeedbackFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  if (!supabase) {
    // Dev fallback — log to console
    console.log("📋 Form Submission (dev mode):", JSON.stringify(data, null, 2));
    // Simulate a brief delay
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true };
  }

  try {
    const { error } = await supabase.from("orientation_feedback").insert([data]);

    if (error) {
      console.error("Supabase insert error:", error);
      if (error.code === '23505') {
        return { success: false, error: "This UID has already submitted feedback!" };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
