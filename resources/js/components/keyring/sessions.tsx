import {
    endSession,
    KeyringRequestError,
    type Session,
} from '@keyringjs/keyring/react';
import { router } from '@inertiajs/react';
import { MonitorSmartphone } from 'lucide-react';
import { useState } from 'react';
import { ago } from '@/components/keyring/sign-in-methods';
import RowIcon from '@/components/keyring/row-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    InsetCardDescription,
    InsetCardList,
    InsetCardTitle,
} from '@/components/ui/inset-card';
import { Spinner } from '@/components/ui/spinner';
import { run } from '@/keyring/actions';
import { type Place, place } from '@/keyring/format';
import { login } from '@/routes';

/**
 * Every session the account could still carry on, straight from Keyring's
 * registry (GET /user/sessions gives the same list). A device is a browser;
 * a session is one sign in on it, so a browser signed in twice shows twice
 * here, and so does a session with no device.
 *
 * Each `id` is a handle that only DELETE /user/sessions/{id} accepts, and it
 * changes when a session moves to a new record, so the list is reloaded
 * after every change.
 */
export default function Sessions({
    sessions,
    locations,
}: {
    sessions: Session[];
    /** Where each device was last seen, by its ID. */
    locations: Record<string, Place>;
}) {
    const [ending, setEnding] = useState<string | null>(null);

    async function end(session: Session) {
        setEnding(session.id);

        const ended = await run(
            () =>
                endSession(session.id).catch((error: unknown) => {
                    // A handle from a list that's been open a while: the
                    // session ended or moved on. The reload shows what's left.
                    if (
                        error instanceof KeyringRequestError &&
                        error.status === 404
                    ) {
                        return null;
                    }

                    throw error;
                }),
            {
                // Ending this session is signing out, so there's no page
                // left to reload or show a message on.
                success: session.current ? false : undefined,
                reload: !session.current,
            },
        );

        setEnding(null);

        if (ended !== null && session.current) {
            router.visit(login());
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="px-3 pt-2 pb-1">
                <InsetCardTitle as="h3">Sessions</InsetCardTitle>
                <InsetCardDescription>
                    Each time your account is signed in. A session ends after
                    two hours unused, or 14 days away with “Remember me”, and 30
                    days after it signed in.
                </InsetCardDescription>
            </div>

            <InsetCardList>
                {sessions.map((session) => (
                    <li
                        key={session.id}
                        className="flex items-center gap-3 px-4 py-3"
                    >
                        <RowIcon icon={MonitorSmartphone} />
                        <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                                <span className="truncate">
                                    {session.name ?? 'Unknown browser'}
                                </span>
                                {session.current && <Badge>This session</Badge>}
                                {session.remembered && (
                                    <Badge variant="secondary">
                                        Remembered
                                    </Badge>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {[
                                    place(
                                        session.device
                                            ? locations[session.device]
                                            : null,
                                    ),
                                    session.ip,
                                    `signed in ${ago(session.signedInAt)}`,
                                    `active ${ago(session.lastActiveAt)}`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={ending !== null}
                            onClick={() => void end(session)}
                        >
                            {ending === session.id && <Spinner />}
                            {session.current ? 'Sign out' : 'End session'}
                        </Button>
                    </li>
                ))}
            </InsetCardList>
        </div>
    );
}
