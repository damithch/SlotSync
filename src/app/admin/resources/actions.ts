"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createResource, setResourceActive, updateResource } from "@/lib/resources";
import { resourceSchema } from "@/lib/validation";

export type ResourceFormState = {
  success?: string;
  error?: string;
  fieldErrors?: Partial<Record<"name" | "typeId" | "location" | "capacity" | "description", string[]>>;
  // What the admin typed, so the form keeps it when there's an error.
  values?: Record<string, string>;
};

// Bound ids come from the browser, so they're validated like any other input.
const idSchema = z.string().uuid();

function parseForm(formData: FormData) {
  const values = Object.fromEntries(
    [...formData.entries()].filter(([key]) => !key.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );
  return { values, parsed: resourceSchema.safeParse(values) };
}

function refreshResourcePages() {
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}

export async function createResourceAction(_prev: ResourceFormState, formData: FormData): Promise<ResourceFormState> {
  await requireAdmin();

  const { values, parsed } = parseForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const result = await createResource(parsed.data);
  if (!result.ok) return { error: result.error, values };

  refreshResourcePages();
  return { success: `"${parsed.data.name}" was created.` };
}

export async function updateResourceAction(
  id: string,
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  await requireAdmin();

  const { values, parsed } = parseForm(formData);
  if (!idSchema.safeParse(id).success) return { error: "This resource no longer exists.", values };
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const result = await updateResource(id, parsed.data);
  if (!result.ok) return { error: result.error, values };

  refreshResourcePages();
  revalidatePath(`/resources/${id}`);
  return { success: "Changes saved." };
}

export async function setResourceActiveAction(id: string, isActive: boolean) {
  await requireAdmin();
  if (!idSchema.safeParse(id).success || typeof isActive !== "boolean") return;

  await setResourceActive(id, isActive);
  refreshResourcePages();
  revalidatePath(`/resources/${id}`);
}
