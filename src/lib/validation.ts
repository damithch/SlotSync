import { z } from "zod";

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
