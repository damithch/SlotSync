import { db } from "@/lib/db";
import type { ResourceInput } from "@/lib/validation";

export type ResourceResult = { ok: true } | { ok: false; error: string };

export function listResourceTypes() {
  return db.resourceType.findMany({ orderBy: { name: "asc" } });
}

// All resources, active ones first. Inactive ones are still listed (with their status) but can't be booked.
export function listResources(filter: { typeId?: string } = {}) {
  return db.resource.findMany({
    where: { typeId: filter.typeId },
    include: { type: true },
    orderBy: [{ isActive: "desc" }, { type: { name: "asc" } }, { name: "asc" }],
  });
}

export async function createResource(input: ResourceInput): Promise<ResourceResult> {
  const type = await db.resourceType.findUnique({ where: { id: input.typeId } });
  if (!type) return { ok: false, error: "That resource type no longer exists." };

  await db.resource.create({ data: input });
  return { ok: true };
}
