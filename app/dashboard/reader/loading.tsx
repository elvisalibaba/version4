export default function ReaderDashboardLoading() {
  return (
    <section role="status" aria-busy="true" className="space-y-5 sm:space-y-6">
      <span className="sr-only">Chargement de votre espace lecteur…</span>

      <div aria-hidden="true" className="animate-pulse space-y-5">
        <div className="rounded-md border border-rule bg-white/90 p-5 sm:rounded-md sm:p-6">
          <div className="h-5 w-28 rounded-full bg-paper-deep" />
          <div className="mt-4 h-8 w-3/4 max-w-xl rounded-md bg-paper-deep" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-paper-deep" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-md border border-rule bg-white/90 p-4">
              <div className="h-3 w-20 rounded-full bg-paper-deep" />
              <div className="mt-4 h-7 w-14 rounded-md bg-paper-deep" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 rounded-md border border-rule bg-white/90" />
          <div className="h-72 rounded-md border border-rule bg-white/90" />
        </div>
      </div>
    </section>
  );
}
