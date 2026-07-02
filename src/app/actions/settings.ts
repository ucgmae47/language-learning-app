"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState = {
  success?: boolean;
  error?: string;
};

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const displayName = (formData.get("display_name") as string | null)?.trim();
  const emailNotifications = formData.get("email_notifications") === "on";

  if (!displayName) return { error: "Display name cannot be empty." };
  if (displayName.length > 60) return { error: "Display name must be 60 characters or fewer." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Persist the email preference in Supabase Auth user metadata so the cron
  // job can read it without a separate table.
  const { error: metaError } = await supabase.auth.updateUser({
    data: { wotd_emails: emailNotifications },
  });

  if (metaError) return { error: metaError.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}
