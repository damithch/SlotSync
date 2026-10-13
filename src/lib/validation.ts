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
