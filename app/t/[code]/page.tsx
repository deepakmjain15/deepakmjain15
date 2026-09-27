import type { Metadata } from "next";
import { PreferenceForm } from "@/components/PreferenceForm";
import { loadResponses, loadTrip } from "@/lib/trip-loader";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await loadTrip((await params).code);
  return { title: `Join ${trip.name}` };
}

export default async function TripJoinPage({ params }: Props) {
  const trip = await loadTrip((await params).code);
  const responses = await loadResponses(trip.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Add your trip preferences</h2>
        <p className="mt-1 text-muted">
          {trip.coordinatorName} is collecting everyone&apos;s preferences to find options the whole group can live
          with. It takes about two minutes.{" "}
          <span className="text-subtle">
            {responses.length} of {trip.expectedTravellers} have answered so far.
          </span>
        </p>
      </div>
      <PreferenceForm code={trip.code} tripName={trip.name} currency={trip.currency} coordinatorName={trip.coordinatorName} />
    </main>
  );
}
