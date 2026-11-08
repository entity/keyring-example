import Heading from '@/components/heading';
import { ago } from '@/components/keyring/sign-in-methods';

export type ActivityRow = {
    id: string;
    type: string;
    factor: string | null;
    ip: string | null;
    at: string;
};

const labels: Record<string, string> = {
    signed_in: 'Signed in',
    signed_out: 'Signed out',
    new_device: 'Signed in from a new device',
    factor_failed: 'Wrong password or code',
    second_factor_failed: 'Right password, wrong second step',
    locked_out: 'Too many attempts, sign in paused',
    confirmed: 'Confirmed it was you',
    authenticator_added: 'Added a sign-in method',
    authenticator_removed: 'Removed a sign-in method',
    recovery_codes_generated: 'Made new recovery codes',
    recovery_code_used: 'Used a recovery code',
    password_changed: 'Changed password',
    password_reset: 'Reset password',
    email_change_requested: 'Asked to change email',
    email_changed: 'Changed email',
    email_change_reverted: 'Undid an email change',
    device_revoked: 'Signed out a device',
    sessions_revoked: 'Signed out everywhere else',
    clone_suspected: 'A security key looked cloned',
};

/**
 * Keyring's security log for this user (Keyring::activity()).
 */
export default function Activity({ activity }: { activity: ActivityRow[] }) {
    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Recent activity"
                description="Sign-ins and security changes on your account."
            />

            <ul className="divide-y rounded-lg border text-sm">
                {activity.map((event) => (
                    <li
                        key={event.id}
                        className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                        <span>
                            {labels[event.type] ??
                                (event.type.startsWith('risk_')
                                    ? 'Something looked unusual'
                                    : event.type)}
                            {event.factor && (
                                <span className="text-muted-foreground">
                                    {' '}
                                    · {event.factor}
                                </span>
                            )}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                            {event.ip} · {ago(event.at)}
                        </span>
                    </li>
                ))}
                {activity.length === 0 && (
                    <li className="px-4 py-3 text-muted-foreground">
                        Nothing yet.
                    </li>
                )}
            </ul>
        </div>
    );
}
