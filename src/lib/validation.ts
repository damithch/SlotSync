import { z } from "zod";
import { isValidDateKey, zonedToInstant } from "@/lib/time";

// Sign in form. Email is trimmed and lowercased so "Admin@SlotSync.dev " still matches.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ?type= on the resources page. Anything that isn't a valid id is ignored (shows all types).
export const resourceFilterSchema = z.object({
  type: z.string().uuid().optional().catch(undefined),
});

// ?date=YYYY-MM-DD on the resource page. Missing or invalid falls back to today.
export const dayQuerySchema = z.object({
  date: z.string().refine(isValidDateKey).optional().catch(undefined),
});

// Optional text field: empty input is stored as null.
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .transform((v) => v || null);

// Create / edit resource form (admin).
export const resourceSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(100, "Name must be 100 characters or fewer"),
  typeId: z.string().uuid("Choose a type"),
  location: z.string().trim().min(1, "Enter a location").max(100, "Location must be 100 characters or fewer"),
  // Empty means "not applicable" (e.g. a projector has no capacity).
  capacity: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(
      z
        .number({ invalid_type_error: "Capacity must be a number" })
        .int("Capacity must be a whole number")
        .min(1, "Capacity must be at least 1")
        .max(1000, "Capacity must be 1000 or less")
        .nullable(),
    ),
  description: optionalText(500, "Description"),
});

export type ResourceInput = z.infer<typeof resourceSchema>;

// "2026-10-13T09:30" from a datetime-local input, read on the organisation's clock.
const localDateTime = (label: string) =>
  z
    .string({ required_error: `Enter the ${label}` })
    .min(1, `Enter the ${label}`)
    .refine((v) => /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v) && isValidDateKey(v.slice(0, 10)), `Enter a valid ${label}`)
    .transform((v) => zonedToInstant(v.slice(0, 10), v.slice(11, 16)));

// Booking form. The other rules (not in the past, resource active, no overlap) need the
// database or the current time, so they live in createReservation().
export const reservationSchema = z
  .object({
    resourceId: z.string().uuid("Choose a resource"),
    startTime: localDateTime("start time"),
    endTime: localDateTime("end time"),
    purpose: z.string().trim().min(1, "Enter a purpose").max(200, "Purpose must be 200 characters or fewer"),
  })
  .refine((v) => v.endTime > v.startTime, { path: ["endTime"], message: "End time must be after the start time" });

export type ReservationInput = z.infer<typeof reservationSchema>;
