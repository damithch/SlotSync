"use client";

import { useActionState } from "react";
import { createReservationAction, type BookingFormState } from "@/app/resources/[id]/actions";

type Field = keyof NonNullable<BookingFormState["fieldErrors"]>;

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 focus:border-blue-600 focus:outline-none aria-invalid:border-red-500";

export function BookingForm({
  resourceId,
  defaultStart,
  defaultEnd,
  timeZone,
}: {
  resourceId: string;
  defaultStart: string;
  defaultEnd: string;
  timeZone: string;
}) {
  const [state, formAction, pending] = useActionState(createReservationAction, {});

  const errorFor = (field: Field) => {
    const message = state.fieldErrors?.[field]?.[0];
    return message ? (
      <p id={`${field}-error`} className="mt-1 text-sm text-red-600">
        {message}
      </p>
    ) : null;
  };
  const invalid = (field: Field) =>
    state.fieldErrors?.[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="resourceId" value={resourceId} />

      <div>
        <label htmlFor="startTime" className="block text-sm font-medium">
          Start
        </label>
        <input
          id="startTime"
          name="startTime"
          type="datetime-local"
          required
          defaultValue={state.values?.startTime ?? defaultStart}
          className={inputClass}
          {...invalid("startTime")}
        />
        {errorFor("startTime")}
      </div>

      <div>
        <label htmlFor="endTime" className="block text-sm font-medium">
          End
        </label>
        <input
          id="endTime"
          name="endTime"
          type="datetime-local"
          required
          defaultValue={state.values?.endTime ?? defaultEnd}
          className={inputClass}
          {...invalid("endTime")}
        />
        {errorFor("endTime")}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="purpose" className="block text-sm font-medium">
          Purpose
        </label>
        <input
          id="purpose"
          name="purpose"
          required
          maxLength={200}
          placeholder="e.g. Team planning meeting"
          defaultValue={state.values?.purpose ?? ""}
          className={inputClass}
          {...invalid("purpose")}
        />
        {errorFor("purpose")}
      </div>

      <p className="text-xs text-gray-500 sm:col-span-2">Times are in {timeZone}.</p>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Booking..." : "Book"}
        </button>
        {state.success && (
          <p role="status" className="text-sm text-green-700">
            {state.success}
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
