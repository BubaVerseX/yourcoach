"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clampAvatarParams, type AvatarParams } from "@/lib/avatar/types";

export type AvatarSlot = "current" | "goal";

export async function saveAvatarParams(slot: AvatarSlot, params: AvatarParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const clamped = clampAvatarParams(params);
  const update = slot === "current" ? { avatar_current: clamped } : { avatar_goal: clamped };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/progress/avatar");
  return { success: true, params: clamped };
}
