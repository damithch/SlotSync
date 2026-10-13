import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { describeRange, listUserReservations } from "@/lib/reservations";
import { toDateKey } from "@/lib/time";
import { CancelButton } from "@/components/cancel-button";

export const metadata = { title: "My bookings · SlotSync" };

type Booking = Awaited<ReturnType<typeof listUserReservations>>["upcoming"][number];

function BookingRow({ booking, now, children }: { booking: Booking; now: Date; children?: React.ReactNode }) {
  const inProgress = booking.status === "CONFIRMED" && booking.startTime <= now && booking.endTime > now;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/resources/${booking.resource.id}?date=${toDateKey(booking.startTime)}`}
            className="font-semibold hover:text-blue-600"
          >
            {booking.resource.name}
          </Link>
          {booking.status === "CANCELLED" && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">Cancelled</span>
          )}
          {inProgress && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">In progress</span>}
        </div>
        <p className="text-sm text-gray-500">
          {describeRange(booking.startTime, booking.endTime)} · {booking.resource.location}
        </p>
        <p className="mt-1 text-sm">{booking.purpose}</p>
      </div>
      {children}
    </li>
  );
}

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const { upcoming, past } = await listUserReservations(session.user.id, now);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">My bookings</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            No upcoming bookings.{" "}
            <Link href="/resources" className="text-blue-600 hover:underline">
              Find something to book
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} now={now}>
                {b.startTime > now && <CancelButton reservationId={b.id} />}
              </BookingRow>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Past and cancelled</h2>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Nothing here yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 opacity-80">
            {past.map((b) => (
              <BookingRow key={b.id} booking={b} now={now} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
