import { AnalyzeForm } from "@/components/analyze-form";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  let isLoggedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  return (
    <div className="space-y-4">
      <AnalyzeForm isLoggedIn={isLoggedIn} />
    </div>
  );
}
