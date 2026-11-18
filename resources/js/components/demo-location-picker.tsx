import { router, usePage } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoLocation } from '@/routes';

export type DemoLocation = {
    current: string;
    places: Record<string, { city: string; country: string }>;
} | null;

/**
 * Only with KEYRING_LOCATOR=demo: pretend this browser is somewhere else,
 * to try the NewCountry and ImpossibleTravel risk signals on localhost.
 * The next sign in is located wherever this says.
 */
export default function DemoLocationPicker() {
    const { demoLocation: location } = usePage<{
        demoLocation: DemoLocation;
    }>().props;

    if (!location) {
        return null;
    }

    return (
        <section
            aria-labelledby="demo-location"
            className="mt-6 rounded-lg border border-dashed p-4 text-sm"
        >
            <h2
                id="demo-location"
                className="flex items-center gap-2 font-medium"
            >
                <MapPin className="size-4" />
                Pretend to be in
            </h2>
            <p className="mt-1 text-muted-foreground">
                A demo aid for the location risk signals: your next sign in
                comes from here. Paris after London is a new country. Tokyo or
                New York straight after either is impossible travel too, and the
                sign in is refused.
            </p>

            <div
                className="mt-3 grid grid-cols-2 gap-2"
                role="group"
                aria-label="Pretend to be in"
            >
                {Object.entries(location.places).map(([key, city]) => (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={location.current === key}
                        onClick={() =>
                            router.post(
                                demoLocation(),
                                { place: key },
                                { preserveScroll: true, preserveState: true },
                            )
                        }
                        className={cn(
                            'rounded-md border px-3 py-1.5 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            location.current === key &&
                                'border-primary bg-accent font-medium',
                        )}
                    >
                        {city.city}
                    </button>
                ))}
            </div>
        </section>
    );
}
