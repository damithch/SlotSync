import { requireAdmin } from "@/lib/auth";
import { listResources, listResourceTypes } from "@/lib/resources";
import { ResourceForm } from "@/components/resource-form";

export const metadata = { title: "Manage resources · SlotSync" };

export default async function AdminResourcesPage() {
  await requireAdmin();
  const [types, resources] = await Promise.all([listResourceTypes(), listResources()]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold">Manage resources</h1>

      <section className="mt-6 rounded-lg border border-gray-200 p-4">
        <h2 className="mb-4 font-semibold">Add a resource</h2>
        <ResourceForm types={types} />
      </section>

      <section className="mt-8">
        <h2 className="font-semibold">All resources ({resources.length})</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Capacity</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2">{r.type.name}</td>
                  <td className="px-4 py-2">{r.location}</td>
                  <td className="px-4 py-2">{r.capacity ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
