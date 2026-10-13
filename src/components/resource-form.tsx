"use client";

import { useActionState } from "react";
import type { ResourceFormState } from "@/app/admin/resources/actions";

type Field = keyof NonNullable<ResourceFormState["fieldErrors"]>;

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 focus:border-blue-600 focus:outline-none aria-invalid:border-red-500";

// Used for both creating (empty) and editing (pre-filled with `defaults`).
export function ResourceForm({
  types,
  action,
  defaults = {},
  submitLabel,
  pendingLabel,
}: {
  types: { id: string; name: string }[];
  action: (prev: ResourceFormState, formData: FormData) => Promise<ResourceFormState>;
  defaults?: Partial<Record<Field, string>>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  // After an error, show what was typed; otherwise the saved values.
  const value = (field: Field) => state.values?.[field] ?? defaults[field] ?? "";
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
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input id="name" name="name" required defaultValue={value("name")} className={inputClass} {...invalid("name")} />
        {errorFor("name")}
      </div>

      <div>
        <label htmlFor="typeId" className="block text-sm font-medium">
          Type
        </label>
        <select id="typeId" name="typeId" required defaultValue={value("typeId")} className={inputClass} {...invalid("typeId")}>
          <option value="" disabled>
            Choose a type
          </option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {errorFor("typeId")}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location
        </label>
        <input
          id="location"
          name="location"
          required
          defaultValue={value("location")}
          className={inputClass}
          {...invalid("location")}
        />
        {errorFor("location")}
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium">
          Capacity <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          max={1000}
          defaultValue={value("capacity")}
          className={inputClass}
          {...invalid("capacity")}
        />
        {errorFor("capacity")}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={value("description")}
          className={inputClass}
          {...invalid("description")}
        />
        {errorFor("description")}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
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
