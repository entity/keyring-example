import Heading from '@/components/heading';
import { ago } from '@/components/keyring/sign-in-methods';
import { Badge } from '@/components/ui/badge';

export type ActivityRow = {
    id: string;
    type: string;
    severity: 'info' | 'notice' | 'warning' | 'critical';
    factor: string | null;
    ip: string | null;
    at: string;
};

/**
 * Every entry type Keyring writes about a user. "Entry Types" in Keyring's
 * docs lists them, with what each means.
 */
const labels: Record<string, string> = {
    signed_in: 'Signed in',
    signed_out: 'Signed out',
    confirmed: 'Confirmed it was you',
    new_device: 'Signed in from a new device',
    factor_failed: 'Wrong password or code',
    second_factor_failed: 'Right password, wrong second step',
    locked_out: 'Too many attempts, sign in paused',
    account_locked: 'Account locked until the password is reset',
    authenticator_added: 'Added a sign-in method',
    authenticator_removed: 'Removed a sign-in method',
    authenticator_removal_refused:
        'Kept a sign-in method that couldn’t be removed',
    enrollment_refused: 'Couldn’t add a sign-in method',
    recovery_codes_generated: 'Made new recovery codes',
    recovery_code_used: 'Used a recovery code',
    password_changed: 'Changed password',
    password_reset: 'Reset password',
    email_change_requested: 'Asked to change email',
    email_changed: 'Changed email',
    email_change_reverted: 'Undid an email change',
    device_revoked: 'Signed out a device',
    device_reported: 'Signed out a device from a “this wasn’t me” link',
    sessions_revoked: 'Signed out other sessions',
    session_ended: 'A session was ended',
    remember_me_reused: 'A “remember me” cookie was used twice, session ended',
    access_refused: 'Asked for something that isn’t this account’s',
    link_refused: 'An emailed link was refused',
    verification_refused: 'A sign in was refused by a safeguard',
    refusals_limited: 'More refusals followed and weren’t listed',
    protection_bypassed: 'Changed a protected detail outside the usual flow',
    clone_suspected: 'A security key looked cloned',
    risk_step_up: 'Something looked unusual, asked for another step',
    risk_reauthenticate: 'Something looked unusual, signed out',
    risk_notified: 'Something looked unusual, sent an email',
    risk_denied: 'Something looked unusual, sign in refused',
    risk_locked: 'Something looked unusual, sign in paused',
    risk_revoked_sessions: 'Something looked unusual, signed out everywhere',
};

/** How each of Keyring's four severities is shown. Info has no badge. */
const severities: Record<
    string,
    { label: string; variant: 'secondary' | 'outline' | 'destructive' }
> = {
    notice: { label: 'Notice', variant: 'secondary' },
    warning: { label: 'Warning', variant: 'outline' },
    critical: { label: 'Critical', variant: 'destructive' },
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
                description="Sign-ins, security changes and anything that was refused on your account. Entries are kept for 180 days."
            />

            <ul className="divide-y rounded-lg border text-sm">
                {activity.map((event) => (
                    <li
                        key={event.id}
                        className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                        <span>
                            {labels[event.type] ?? event.type}
                            {event.factor && (
                                <span className="text-muted-foreground">
                                    {' '}
                                    · {event.factor}
                                </span>
                            )}
                            {severities[event.severity] && (
                                <Badge
                                    variant={severities[event.severity].variant}
                                    className="ml-2"
                                >
                                    {severities[event.severity].label}
                                </Badge>
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
