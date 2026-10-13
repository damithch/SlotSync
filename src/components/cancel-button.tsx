"use client";

import { useActionState } from "react";
import { cancelReservationAction, type CancelState } from "@/app/bookings/actions";

export function CancelButton({ reservationId }: { reservationId: string }) {
  const [state, formAction, pending] = useActionState<CancelState>(
    () => cancelReservationAction(reservationId),
    {},
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Cancel this booking? The slot will be freed for others.")) e.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Cancelling..." : "Cancel"}
      </button>
      {state.error && (
        <p role="alert" className="text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
