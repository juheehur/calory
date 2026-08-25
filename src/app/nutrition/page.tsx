import { NutritionPanel } from "@/components/nutrition-panel";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function NutritionPage() {
  let isLoggedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }
  return <NutritionPanel isLoggedIn={isLoggedIn} />;
}
