import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listResources } from "@/lib/resources";
import { ADMIN_LIST_LIMIT, describeRange, listAllReservations } from "@/lib/reservations";
import { dayRange, toDateKey } from "@/lib/time";
import { adminBookingFilterSchema } from "@/lib/validation";
import { CancelButton } from "@/components/cancel-button";

export const metadata = { title: "All bookings · SlotSync" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string; date?: string }>;
}) {
  await requireAdmin();
  const filter = adminBookingFilterSchema.parse(await searchParams);
  const [resources, { reservations, total }] = await Promise.all([
    listResources(),
    listAllReservations({ resourceId: filter.resource, day: filter.date ? dayRange(filter.date) : undefined }),
  ]);
  const now = new Date();
  const filtered = Boolean(filter.resource || filter.date);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold">All bookings</h1>

      {/* A plain GET form: filters live in the URL, so they can be bookmarked and work without JavaScript. */}
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="resource" className="block text-sm font-medium">
            Resource
          </label>
          <select
            id="resource"
            name="resource"
            defaultValue={filter.resource ?? ""}
            className="mt-1 rounded-md border border-gray-300 bg-transparent px-3 py-2"
          >
            <option value="">All resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={filter.date ?? ""}
            className="mt-1 rounded-md border border-gray-300 bg-transparent px-3 py-2"
          />
        </div>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Filter
        </button>
        {filtered && (
          <Link href="/admin/bookings" className="px-2 py-2 text-sm text-blue-600 hover:underline">
            Clear
          </Link>
        )}
      </form>

      <p className="mt-6 text-sm text-gray-500">
        {total > reservations.length
          ? `Showing the ${ADMIN_LIST_LIMIT} most recent of ${total} bookings. Filter to narrow it down.`
          : `${total} booking${total === 1 ? "" : "s"}`}
      </p>

      {reservations.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          {filtered ? "No bookings match these filters." : "No bookings yet."}
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Resource</th>
                <th className="px-4 py-2 font-medium">Booked by</th>
                <th className="px-4 py-2 font-medium">Purpose</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((b) => {
                const cancelled = b.status === "CANCELLED";
                const ended = b.endTime <= now;
                const status = cancelled
                  ? { label: "Cancelled", className: "bg-gray-200 text-gray-600" }
                  : ended
                    ? { label: "Completed", className: "bg-blue-50 text-blue-700" }
                    : b.startTime <= now
                      ? { label: "In progress", className: "bg-amber-100 text-amber-800" }
                      : { label: "Upcoming", className: "bg-green-100 text-green-800" };
                return (
                  <tr key={b.id} className={`border-b border-gray-100 last:border-0 ${cancelled ? "text-gray-400" : ""}`}>
                    <td className="px-4 py-2 whitespace-nowrap">{describeRange(b.startTime, b.endTime)}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/resources/${b.resource.id}?date=${toDateKey(b.startTime)}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {b.resource.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      {b.user.name}
                      <div className="text-xs text-gray-500">{b.user.email}</div>
                    </td>
                    <td className="px-4 py-2">{b.purpose}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {!cancelled && b.startTime > now && <CancelButton reservationId={b.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
