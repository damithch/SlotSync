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

export function getResource(id: string) {
  return db.resource.findUnique({ where: { id }, include: { type: true } });
}

async function typeExists(typeId: string) {
  return (await db.resourceType.count({ where: { id: typeId } })) > 0;
}

export async function createResource(input: ResourceInput): Promise<ResourceResult> {
  if (!(await typeExists(input.typeId))) return { ok: false, error: "That resource type no longer exists." };

  await db.resource.create({ data: input });
  return { ok: true };
}

export async function updateResource(id: string, input: ResourceInput): Promise<ResourceResult> {
  if (!(await getResource(id))) return { ok: false, error: "This resource no longer exists." };
  if (!(await typeExists(input.typeId))) return { ok: false, error: "That resource type no longer exists." };

  await db.resource.update({ where: { id }, data: input });
  return { ok: true };
}

// Resources are deactivated, never deleted, so their past bookings stay intact.
// Existing bookings are kept; an inactive resource just can't take new ones.
export async function setResourceActive(id: string, isActive: boolean): Promise<ResourceResult> {
  if (!(await getResource(id))) return { ok: false, error: "This resource no longer exists." };

  await db.resource.update({ where: { id }, data: { isActive } });
  return { ok: true };
}
