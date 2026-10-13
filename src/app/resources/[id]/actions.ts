"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createReservation } from "@/lib/reservations";
import { reservationSchema } from "@/lib/validation";

export type BookingFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Partial<Record<"startTime" | "endTime" | "purpose", string[]>>;
  values?: Record<string, string>;
};

export async function createReservationAction(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const session = await auth();
  if (!session) return { error: "Your session has expired. Please sign in again." };

  const values = Object.fromEntries(
    [...formData.entries()].filter(([key]) => !key.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );
  const parsed = reservationSchema.safeParse(values);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    return { error: formErrors[0] ?? "Please fix the highlighted fields.", fieldErrors, values };
  }

  // The user always comes from the session, never from the form.
  const result = await createReservation({ ...parsed.data, userId: session.user.id });
  if (!result.ok) return { error: result.error, values };

  revalidatePath(`/resources/${parsed.data.resourceId}`);
  revalidatePath("/bookings");
  return { success: result.message };
}
