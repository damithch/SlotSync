import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getResource } from "@/lib/resources";
import { buildDaySchedule, listReservationsBetween } from "@/lib/reservations";
import {
  addDays,
  APP_TIME_ZONE,
  dayRange,
  formatDateKey,
  formatTime,
  toInputValue,
  todayKey,
  zonedToInstant,
} from "@/lib/time";
import { dayQuerySchema } from "@/lib/validation";
import { BookingForm } from "@/components/booking-form";

const HOUR = 60 * 60 * 1000;

// Suggested start: the next full hour if it's today, otherwise 09:00 on the chosen day.
// Rounded on the organisation's clock, since some zones (like Colombo, UTC+5:30) aren't whole hours from UTC.
function suggestedStart(date: string, today: string, now: Date) {
  if (date !== today) return zonedToInstant(date, "09:00");
  const nextHour = Number(formatTime(now).slice(0, 2)) + 1;
  return nextHour === 24
    ? zonedToInstant(addDays(today, 1), "00:00")
    : zonedToInstant(today, `${String(nextHour).padStart(2, "0")}:00`);
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const resource = await getResource(id);
  if (!resource) notFound();

  const today = todayKey();
  const date = dayQuerySchema.parse(await searchParams).date ?? today;
  const { start, end } = dayRange(date);
  const reservations = await listReservationsBetween(resource.id, start, end);
  const now = new Date();
  const schedule = buildDaySchedule(start, end, reservations, now);
  const bookFrom = suggestedStart(date, today, now);

  // The day's end is the next midnight; show it as 24:00 rather than 00:00.
  const timeLabel = (t: Date) => (t.getTime() === end.getTime() ? "24:00" : formatTime(t));
  const dayLink = (d: string) => `/resources/${resource.id}?date=${d}`;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/resources" className="text-sm text-blue-600 hover:underline">
        ← All resources
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{resource.name}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            resource.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"
          }`}
        >
          {resource.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <p className="mt-1 text-gray-500">
        {resource.type.name} · {resource.location}
        {resource.capacity ? ` · ${resource.capacity} people` : ""}
      </p>
      {resource.description && <p className="mt-2">{resource.description}</p>}
      {!resource.isActive && (
        <p className="mt-4 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
          This resource is inactive and can&apos;t be booked right now.
        </p>
      )}

      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={dayLink(addDays(date, -1))} className="rounded-md border border-gray-300 px-3 py-1.5 hover:border-blue-600">
            ← Previous
          </Link>
          {/* A plain GET form, so picking a date works without JavaScript. */}
          <form className="flex gap-2">
            <label htmlFor="date" className="sr-only">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              className="rounded-md border border-gray-300 bg-transparent px-3 py-1.5"
            />
            <button type="submit" className="rounded-md border border-gray-300 px-3 py-1.5 hover:border-blue-600">
              Show
            </button>
          </form>
          <Link href={dayLink(addDays(date, 1))} className="rounded-md border border-gray-300 px-3 py-1.5 hover:border-blue-600">
            Next →
          </Link>
          {date !== today && (
            <Link href={dayLink(today)} className="px-2 text-sm text-blue-600 hover:underline">
              Today
            </Link>
          )}
        </div>

        <h2 className="mt-6 text-lg font-semibold">{formatDateKey(date)}</h2>
        {date < today && <p className="mt-1 text-sm text-gray-500">This day is in the past.</p>}

        {schedule.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            No bookings and no free time left on this day.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {schedule.map((block) =>
              block.kind === "booked" ? (
                <li
                  key={block.reservation.id}
                  className="flex flex-wrap items-baseline gap-x-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900"
                >
                  <span className="w-28 font-mono text-sm">
                    {timeLabel(block.start)}–{timeLabel(block.end)}
                  </span>
                  <span className="font-medium">{block.reservation.purpose}</span>
                  <span className="text-sm text-red-700">Booked by {block.reservation.user.name}</span>
                </li>
              ) : (
                <li
                  key={`free-${block.start.toISOString()}`}
                  className="flex flex-wrap items-baseline gap-x-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-900"
                >
                  <span className="w-28 font-mono text-sm">
                    {timeLabel(block.start)}–{timeLabel(block.end)}
                  </span>
                  <span className="font-medium">Free</span>
                </li>
              ),
            )}
          </ol>
        )}
      </section>

      {resource.isActive && date >= today && (
        <section className="mt-8 rounded-lg border border-gray-200 p-4">
          <h2 className="mb-4 text-lg font-semibold">Book {resource.name}</h2>
          {/* key: a new day starts the form fresh with that day's suggested times. */}
          <BookingForm
            key={date}
            resourceId={resource.id}
            defaultStart={toInputValue(bookFrom)}
            defaultEnd={toInputValue(new Date(bookFrom.getTime() + HOUR))}
            timeZone={APP_TIME_ZONE}
          />
        </section>
      )}
    </main>
  );
}
