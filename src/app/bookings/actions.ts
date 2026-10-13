"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { cancelReservation } from "@/lib/reservations";

export type CancelState = { error?: string; success?: string };

// Used by members on /bookings and by admins on /admin/bookings; cancelReservation() decides who may cancel what.
export async function cancelReservationAction(id: string): Promise<CancelState> {
  const session = await auth();
  if (!session) return { error: "Your session has expired. Please sign in again." };
  if (!z.string().uuid().safeParse(id).success) return { error: "This booking no longer exists." };

  const result = await cancelReservation(id, session.user);
  if (!result.ok) return { error: result.error };

  revalidatePath("/bookings");
  revalidatePath("/admin/bookings");
  revalidatePath("/resources/[id]", "page");
  return { success: result.message };
}
