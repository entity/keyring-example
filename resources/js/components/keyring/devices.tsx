import { router } from '@inertiajs/react';
import { Laptop } from 'lucide-react';
import { ago } from '@/components/keyring/sign-in-methods';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Place, place } from '@/keyring/format';

export type DeviceRow = {
    id: string;
    name: string | null;
    description: string;
    ip: string | null;
    /** Empty until the app has a locator (KEYRING_LOCATOR). */
    location: Place;
    lastActiveAt: string | null;
    trusted: boolean;
    current: boolean;
    sessions: number;
};

/**
 * Browsers that have signed in to the account. These are plain Inertia
 * visits to Keyring's routes, which flash a status and come back here.
 */
export default function Devices({ devices }: { devices: DeviceRow[] }) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-medium">Devices</h3>
                <p className="text-sm text-muted-foreground">
                    Browsers that have signed in. Signing one out ends every
                    session on it.
                </p>
            </div>

            <ul className="divide-y rounded-lg border">
                {devices.map((device) => (
                    <li key={device.id} className="flex items-center gap-3 p-4">
                        <Laptop className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                                <span className="truncate">
                                    {device.name ?? device.description}
                                </span>
                                {device.current && <Badge>This device</Badge>}
                                {device.trusted && (
                                    <Badge variant="secondary">Trusted</Badge>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {[
                                    place(device.location),
                                    device.ip,
                                    `active ${ago(device.lastActiveAt)}`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        {!device.current && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    router.delete(
                                        `/user/devices/${device.id}`,
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Sign out
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
