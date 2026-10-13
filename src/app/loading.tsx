// Shown while a page loads its data on the server.
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-4 w-72 rounded bg-gray-200" />
        <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </main>
  );
}
