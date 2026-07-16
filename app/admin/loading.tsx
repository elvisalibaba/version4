export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4 pb-10 sm:space-y-6">
      <span className="sr-only">Chargement de l’administration…</span>

      <div className="motion-safe:animate-pulse rounded-[1.35rem] border border-[#e6dccd] bg-white/85 p-4 sm:rounded-[2rem] sm:p-6">
        <div className="h-3 w-28 rounded-full bg-[#eee6da]" />
        <div className="mt-4 h-8 w-3/4 max-w-md rounded-xl bg-[#e9e0d3] sm:h-10" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-[#f0e9df]" />
        <div className="mt-2 h-4 w-2/3 max-w-lg rounded-full bg-[#f0e9df]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="motion-safe:animate-pulse rounded-[1.35rem] border border-[#e6dccd] bg-white/85 p-4 sm:rounded-[1.75rem] sm:p-5"
          >
            <div className="h-10 w-10 rounded-xl bg-[#eee6da]" />
            <div className="mt-4 h-3 w-24 rounded-full bg-[#f0e9df]" />
            <div className="mt-3 h-8 w-20 rounded-lg bg-[#e9e0d3]" />
          </div>
        ))}
      </div>

      <div className="motion-safe:animate-pulse rounded-[1.35rem] border border-[#e6dccd] bg-white/85 p-4 sm:rounded-[1.9rem] sm:p-5">
        <div className="h-5 w-40 rounded-lg bg-[#e9e0d3]" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} aria-hidden="true" className="h-14 rounded-xl bg-[#f5f0e8]" />
          ))}
        </div>
      </div>
    </div>
  );
}
