import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getResource, listResourceTypes } from "@/lib/resources";
import { ResourceForm } from "@/components/resource-form";
import { updateResourceAction } from "../../actions";

export const metadata = { title: "Edit resource · SlotSync" };

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const [resource, types] = await Promise.all([getResource(id), listResourceTypes()]);
  if (!resource) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/admin/resources" className="text-sm text-blue-600 hover:underline">
        ← All resources
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Edit {resource.name}</h1>
      {!resource.isActive && (
        <p className="mt-1 text-sm text-gray-500">This resource is inactive and can&apos;t be booked.</p>
      )}

      <section className="mt-6 rounded-lg border border-gray-200 p-4">
        <ResourceForm
          types={types}
          action={updateResourceAction.bind(null, resource.id)}
          defaults={{
            name: resource.name,
            typeId: resource.typeId,
            location: resource.location,
            capacity: resource.capacity?.toString() ?? "",
            description: resource.description ?? "",
          }}
          submitLabel="Save changes"
          pendingLabel="Saving..."
        />
      </section>
    </main>
  );
}
