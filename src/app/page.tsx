import { db } from "@/lib/db";

// Always read fresh data from the database instead of caching the page at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const resources = await db.resource.findMany({
    include: { type: true },
    orderBy: [{ type: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">SlotSync</h1>
      <p className="mt-1 text-gray-600">Shared resources and their availability, in one place.</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {resources.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{r.name}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  r.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
                }`}
              >
                {r.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {r.type.name} · {r.location}
              {r.capacity ? ` · ${r.capacity} people` : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
