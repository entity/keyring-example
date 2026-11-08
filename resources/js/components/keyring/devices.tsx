import { router } from '@inertiajs/react';
import { Laptop } from 'lucide-react';
import Heading from '@/components/heading';
import { ago } from '@/components/keyring/sign-in-methods';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type DeviceRow = {
    id: string;
    name: string | null;
    description: string;
    ip: string | null;
    location: string | null;
    lastActiveAt: string | null;
    trusted: boolean;
    current: boolean;
    sessions: number;
};

/**
 * Where the account is signed in. These are plain Inertia visits to
 * Keyring's routes, which flash a status and come back here.
 */
export default function Devices({ devices }: { devices: DeviceRow[] }) {
    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Devices"
                description="Browsers signed in to your account. Sign out any you don't recognise."
            />

            <ul className="divide-y rounded-lg border">
                {devices.map((device) => (
                    <li key={device.id} className="flex items-center gap-3 p-4">
                        <Laptop className="size-5 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 text-sm font-medium">
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
                                    device.location,
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

            {devices.length > 1 && (
                <Button
                    variant="outline"
                    onClick={() =>
                        router.delete('/user/devices', { preserveScroll: true })
                    }
                >
                    Sign out everywhere else
                </Button>
            )}
        </div>
    );
}
