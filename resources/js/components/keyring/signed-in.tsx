import { endOtherSessions, type Session } from '@entity/keyring/react';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import Devices, { type DeviceRow } from '@/components/keyring/devices';
import Sessions from '@/components/keyring/sessions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { run } from '@/keyring/actions';

/**
 * Where the account is signed in: its devices, and the sessions on them.
 * "Sign out everywhere else" is DELETE /user/sessions, which ends every
 * session but this one, stops trusting the other devices and cancels a
 * pending email change. DELETE /user/devices does the same.
 */
export default function SignedIn({
    devices,
    sessions,
}: {
    devices: DeviceRow[];
    sessions: Session[];
}) {
    const [signingOut, setSigningOut] = useState(false);
    // Other devices stay listed once their sessions end. Only one that's
    // still signed in, or trusted, has anything left to sign out.
    const elsewhere =
        sessions.some((session) => !session.current) ||
        devices.some(
            (device) =>
                !device.current && (device.sessions > 0 || device.trusted),
        );
    const locations = Object.fromEntries(
        devices.map((device) => [device.id, device.location]),
    );

    async function signOutEverywhereElse() {
        setSigningOut(true);
        await run(() => endOtherSessions());
        setSigningOut(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <Heading
                    variant="small"
                    title="Where you’re signed in"
                    description={
                        elsewhere
                            ? 'If you see something you don’t recognise, sign out everywhere else and change your password.'
                            : 'Only here, in this browser.'
                    }
                />

                {elsewhere && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 self-start"
                        disabled={signingOut}
                        onClick={() => void signOutEverywhereElse()}
                    >
                        {signingOut ? <Spinner /> : <LogOut />}
                        Sign out everywhere else
                    </Button>
                )}
            </div>

            <Devices devices={devices} />

            <Sessions sessions={sessions} locations={locations} />
        </div>
    );
}
