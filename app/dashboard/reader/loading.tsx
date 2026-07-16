export default function ReaderDashboardLoading() {
  return (
    <section role="status" aria-busy="true" className="space-y-5 sm:space-y-6">
      <span className="sr-only">Chargement de votre espace lecteur…</span>

      <div aria-hidden="true" className="animate-pulse space-y-5">
        <div className="rounded-[1.5rem] border border-[#e7ddd1] bg-white/90 p-5 sm:rounded-[2rem] sm:p-6">
          <div className="h-5 w-28 rounded-full bg-[#eee7de]" />
          <div className="mt-4 h-8 w-3/4 max-w-xl rounded-xl bg-[#e7dfd5]" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-[#f0eae3]" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-[1.35rem] border border-[#ece3d7] bg-white/90 p-4">
              <div className="h-3 w-20 rounded-full bg-[#eee7de]" />
              <div className="mt-4 h-7 w-14 rounded-lg bg-[#e7dfd5]" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-[1.5rem] border border-[#ece3d7] bg-white/90" />
          <div className="h-72 rounded-[1.5rem] border border-[#ece3d7] bg-white/90" />
        </div>
      </div>
    </section>
  );
}
