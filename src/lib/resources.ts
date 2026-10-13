import { db } from "@/lib/db";

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
