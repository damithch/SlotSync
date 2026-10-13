import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDateKey, formatTime, toDateKey } from "@/lib/time";
import type { ReservationInput } from "@/lib/validation";

export type ReservationResult = { ok: true; message: string } | { ok: false; error: string };

export const SLOT_TAKEN_MESSAGE = "This slot was just booked by someone else. Please pick another time.";

// Confirmed bookings that overlap [start, end), i.e. startTime < end AND endTime > start.
export function listReservationsBetween(resourceId: string, start: Date, end: Date) {
  return db.reservation.findMany({
    where: { resourceId, status: "CONFIRMED", startTime: { lt: end }, endTime: { gt: start } },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });
}

// "Tuesday, 13 October 2026, 09:00–10:00" (or across two days if the booking crosses midnight).
export function describeRange(start: Date, end: Date) {
  const startDay = toDateKey(start);
  const endDay = toDateKey(end);
  return startDay === endDay
    ? `${formatDateKey(startDay)}, ${formatTime(start)}–${formatTime(end)}`
    : `${formatDateKey(startDay)} ${formatTime(start)} – ${formatDateKey(endDay)} ${formatTime(end)}`;
}

// PostgreSQL rejected the insert because of the no_overlapping_reservations exclusion constraint.
// Prisma has no named error for this, so we look for the SQLSTATE and constraint name in the message.
function isOverlapViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientUnknownRequestError &&
    error.message.includes("23P01") &&
    error.message.includes("no_overlapping_reservations")
  );
}

export async function createReservation(
  input: ReservationInput & { userId: string },
  now = new Date(),
): Promise<ReservationResult> {
  const { resourceId, userId, startTime, endTime, purpose } = input;

  // Rule 1: end after start (the form schema checks this too; the database has a CHECK constraint as well).
  if (endTime <= startTime) return { ok: false, error: "End time must be after the start time." };

  // Rule 2: no bookings in the past.
  if (startTime < now) return { ok: false, error: "You can't book a time that has already started or passed." };

  // Rule 3: only active resources can be booked.
  const resource = await db.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return { ok: false, error: "This resource no longer exists." };
  if (!resource.isActive) return { ok: false, error: `${resource.name} is inactive and can't be booked.` };

  // Rule 4: no overlap with another confirmed booking. End times are exclusive, so 9–10 and 10–11 are fine.
  const clash = await db.reservation.findFirst({
    where: { resourceId, status: "CONFIRMED", startTime: { lt: endTime }, endTime: { gt: startTime } },
    orderBy: { startTime: "asc" },
  });
  if (clash) {
    return {
      ok: false,
      error: `${resource.name} is already booked for ${describeRange(clash.startTime, clash.endTime)}. Please pick another time.`,
    };
  }

  // Two people can pass the check above at the same moment. The database constraint is the final
  // guard: only one insert succeeds, and the other gets a friendly message.
  try {
    await db.reservation.create({ data: { resourceId, userId, startTime, endTime, purpose } });
  } catch (error) {
    if (isOverlapViolation(error)) return { ok: false, error: SLOT_TAKEN_MESSAGE };
    throw error;
  }

  return { ok: true, message: `Booked ${resource.name} for ${describeRange(startTime, endTime)}.` };
}

// A user's bookings, split into upcoming (confirmed and not yet ended) and past (ended or cancelled).
export async function listUserReservations(userId: string, now = new Date()) {
  const include = { resource: { select: { id: true, name: true, location: true } } };
  const [upcoming, past] = await Promise.all([
    db.reservation.findMany({
      where: { userId, status: "CONFIRMED", endTime: { gt: now } },
      include,
      orderBy: { startTime: "asc" },
    }),
    db.reservation.findMany({
      where: { userId, OR: [{ status: "CANCELLED" }, { endTime: { lte: now } }] },
      include,
      orderBy: { startTime: "desc" },
      take: 50,
    }),
  ]);
  return { upcoming, past };
}

type Actor = { id: string; role: "ADMIN" | "MEMBER" };

// Rules 5 and 6: members cancel only their own bookings, admins any. Cancelling never deletes;
// it marks the booking CANCELLED, which frees the slot and keeps the history.
export async function cancelReservation(id: string, actor: Actor, now = new Date()): Promise<ReservationResult> {
  const reservation = await db.reservation.findUnique({ where: { id }, include: { resource: true } });
  if (!reservation) return { ok: false, error: "This booking no longer exists." };
  if (actor.role !== "ADMIN" && reservation.userId !== actor.id) {
    return { ok: false, error: "You can only cancel your own bookings." };
  }
  if (reservation.status === "CANCELLED") return { ok: false, error: "This booking is already cancelled." };
  if (reservation.startTime <= now) return { ok: false, error: "This booking has already started and can't be cancelled." };

  // Only update if it's still confirmed, so two cancels at once can't both "succeed".
  const { count } = await db.reservation.updateMany({
    where: { id, status: "CONFIRMED" },
    data: { status: "CANCELLED", cancelledAt: now },
  });
  if (count === 0) return { ok: false, error: "This booking is already cancelled." };

  return {
    ok: true,
    message: `Cancelled ${reservation.resource.name} for ${describeRange(reservation.startTime, reservation.endTime)}.`,
  };
}

type Timed = { startTime: Date; endTime: Date };

export type ScheduleBlock<R extends Timed> =
  | { kind: "booked"; start: Date; end: Date; reservation: R }
  | { kind: "free"; start: Date; end: Date };

// Splits a day into booked and free blocks. Free time that has already passed is left out,
// because a booking can't start in the past.
export function buildDaySchedule<R extends Timed>(
  dayStart: Date,
  dayEnd: Date,
  reservations: R[],
  now: Date,
): ScheduleBlock<R>[] {
  const blocks: ScheduleBlock<R>[] = [];
  const addFree = (start: Date, end: Date) => {
    // Round "now" up to the next minute so free time starts on a whole minute.
    const earliest = new Date(Math.ceil(now.getTime() / 60_000) * 60_000);
    const from = start < earliest ? earliest : start;
    if (from < end) blocks.push({ kind: "free", start: from, end });
  };

  let cursor = dayStart;
  for (const r of [...reservations].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())) {
    // Bookings that run past midnight are clipped to this day.
    const start = r.startTime < dayStart ? dayStart : r.startTime;
    const end = r.endTime > dayEnd ? dayEnd : r.endTime;
    if (start > cursor) addFree(cursor, start);
    blocks.push({ kind: "booked", start, end, reservation: r });
    if (end > cursor) cursor = end;
  }
  if (cursor < dayEnd) addFree(cursor, dayEnd);

  return blocks;
}
