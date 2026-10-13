import Link from "next/link";
import { listResources, listResourceTypes } from "@/lib/resources";
import { resourceFilterSchema } from "@/lib/validation";

export const metadata = { title: "Resources · SlotSync" };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: typeId } = resourceFilterSchema.parse(await searchParams);
  const [types, resources] = await Promise.all([listResourceTypes(), listResources({ typeId })]);

  const filters = [{ id: undefined, name: "All" }, ...types];

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Resources</h1>
      <p className="mt-1 text-gray-500">Pick a resource to see when it&apos;s free and book it.</p>

      <nav aria-label="Filter by type" className="mt-6 flex flex-wrap gap-2">
        {filters.map((t) => {
          const selected = t.id === typeId;
          return (
            <Link
              key={t.name}
              href={t.id ? `/resources?type=${t.id}` : "/resources"}
              aria-current={selected ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${
                selected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 hover:border-blue-600"
              }`}
            >
              {t.name}
            </Link>
          );
        })}
      </nav>

      {resources.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No resources of this type yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <li key={r.id}>
              <Link
                href={`/resources/${r.id}`}
                className={`block h-full rounded-lg border border-gray-200 p-4 hover:border-blue-600 ${
                  r.isActive ? "" : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{r.name}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                      r.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{r.type.name}</p>
                <p className="mt-2 text-sm">
                  {r.location}
                  {r.capacity ? ` · ${r.capacity} people` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
