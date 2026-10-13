"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createResource } from "@/lib/resources";
import { resourceSchema } from "@/lib/validation";

export type ResourceFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "typeId" | "location" | "capacity" | "description", string[]>>;
  // What the admin typed, so the form keeps it when there's an error.
  values?: Record<string, string>;
};

export async function createResourceAction(_prev: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  await requireAdmin();

  const values = Object.fromEntries(
    [...formData.entries()].filter(([key]) => !key.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );
  const parsed = resourceSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const result = await createResource(parsed.data);
  if (!result.ok) return { error: result.error, values };

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
  return { success: `"${parsed.data.name}" was created.` };
}
