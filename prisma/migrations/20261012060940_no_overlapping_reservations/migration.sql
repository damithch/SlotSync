-- Stops double bookings at the database level.
-- For the same resource, no two CONFIRMED reservations may have overlapping time ranges.
-- '[)' means the end time is exclusive, so 9:00-10:00 and 10:00-11:00 are both allowed.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "reservation_end_after_start" CHECK ("endTime" > "startTime");

ALTER TABLE "Reservation"
  ADD CONSTRAINT "no_overlapping_reservations"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE (status = 'CONFIRMED');
