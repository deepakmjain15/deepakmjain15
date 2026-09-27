import { TripTabs } from "@/components/TripTabs";
import { loadLatestAnalysis, loadTrip } from "@/lib/trip-loader";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const trip = await loadTrip(code);
  const analysis = await loadLatestAnalysis(trip.id);

  return (
    <>
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-subtle">
            <span>
              Trip code <span className="font-mono font-semibold tracking-widest text-ink">{trip.code}</span>
            </span>
            <span aria-hidden>·</span>
            <span>Organised by {trip.coordinatorName}</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">{trip.name}</h1>
          <div className="mt-4">
            <TripTabs code={trip.code} hasAnalysis={Boolean(analysis)} />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
