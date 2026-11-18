import {
    KeyRound,
    LogIn,
    LogOut,
    Mail,
    ShieldAlert,
    type LucideIcon,
} from 'lucide-react';
import Heading from '@/components/heading';
import { ago } from '@/components/keyring/sign-in-methods';
import { Badge } from '@/components/ui/badge';
import { factorList, factorName, fullDate } from '@/keyring/format';

export type ActivityRow = {
    id: string;
    type: string;
    severity: 'info' | 'notice' | 'warning' | 'critical';
    factor: string | null;
    /** The parts of the entry's meta the page shows (SecurityController). */
    meta: {
        factors?: string[];
        name?: string;
        count?: number;
        remaining?: number;
        reason?: string;
        reasons?: string[];
        resource?: string;
    };
    /** The device the entry names, or the browser it came from. */
    device: string | null;
    ip: string | null;
    at: string;
};

type Described = { title: string; detail?: string | null };

const plural = (count: number, one: string, many: string) =>
    `${count} ${count === 1 ? one : many}`;

// Why Keyring ended a session on its own (session_ended).
const endedBecause: Record<string, string> = {
    revoked: 'It was signed out from somewhere else.',
    expired: 'It reached its time limit.',
    idle: 'It went unused for too long.',
    other_user: 'Another account signed in on that browser.',
    reused: 'Its cookie turned up in two browsers.',
    risk: 'Something about it looked wrong.',
    not_allowed: 'The account isn’t allowed in.',
};

// Why an emailed link was refused (link_refused).
const linkRefusedBecause: Record<string, string> = {
    token: 'It wasn’t a link we sent.',
    ended: 'What it was for is already over.',
    unknown: 'There’s nothing it could be for.',
    signature: 'It had been changed.',
    expired: 'It had run out.',
};

// What an access_refused entry was about: something that isn't this
// account's (or doesn't exist), or another account's verification link.
const refusedAccess: Record<string, string> = {
    authenticator: 'Asked for a sign-in method that isn’t this account’s',
    device: 'Asked for a device that isn’t this account’s',
    session: 'Asked for a session that isn’t this account’s',
    email_verification:
        'Opened an email verification link meant for another account',
};

// What a risk response did (risk_*). The reasons say what was found.
const riskDid: Record<string, string> = {
    risk_step_up: 'asked for another step',
    risk_reauthenticate: 'signed the session out',
    risk_notified: 'sent you an email',
    risk_denied: 'refused the sign in',
    risk_locked: 'paused signing in',
    risk_revoked_sessions: 'signed out every session',
    risk_password_change: 'asked for a new password',
};

/**
 * Every entry type Keyring writes about a user, in words. "Entry Types" in
 * Keyring's docs lists them, with what each one's meta holds.
 */
function describe(event: ActivityRow): Described {
    const { meta } = event;
    const factor = event.factor ? factorName(event.factor) : null;
    const used = meta.factors?.length
        ? `With your ${factorList(meta.factors)}.`
        : null;

    if (event.type in riskDid) {
        return {
            title: `Something looked unusual, so Keyring ${riskDid[event.type]}`,
            detail: meta.reasons?.join(' '),
        };
    }

    switch (event.type) {
        case 'signed_in':
            return { title: 'Signed in', detail: used };
        case 'confirmed':
            return { title: 'Confirmed it was you', detail: used };
        case 'session_resumed':
            return {
                title: 'Signed back in with “Remember me”',
                detail: 'Nothing was asked for, so the session starts with nothing proved.',
            };
        case 'signed_out':
            return { title: 'Signed out' };
        case 'new_device':
            return { title: 'Signed in from a new device' };
        case 'factor_failed':
            return { title: factor ? `Wrong ${factor}` : 'A sign in failed' };
        case 'second_factor_failed':
            return {
                title: `Right password, wrong ${factor ?? 'second step'}`,
                detail: 'Someone who knows the password tried to sign in.',
            };
        case 'locked_out':
            return { title: 'Too many attempts, so signing in was paused' };
        case 'rate_limited':
            return { title: 'Too many requests, so they were paused' };
        case 'account_locked':
            return {
                title: 'Signing in locked until the password is reset',
                detail: 'Too many failed attempts in a row.',
            };
        case 'authenticator_added':
            return { title: 'Added a sign-in method', detail: meta.name };
        case 'authenticator_removed':
            return { title: 'Removed a sign-in method', detail: meta.name };
        case 'authenticator_removal_refused':
            return {
                title: 'Kept a sign-in method you still need',
                detail: meta.name,
            };
        case 'enrollment_refused':
            return {
                title: factor
                    ? `Couldn’t add the ${factor}`
                    : 'Couldn’t add a sign-in method',
                detail:
                    meta.reason === 'not_allowed'
                        ? 'This account can’t add one yet.'
                        : 'The code or key wasn’t accepted.',
            };
        case 'recovery_codes_generated':
            return { title: 'Made new recovery codes' };
        case 'recovery_code_used':
            return {
                title: 'Used a recovery code',
                detail:
                    meta.remaining === undefined
                        ? null
                        : `${plural(meta.remaining, 'code', 'codes')} left.`,
            };
        case 'password_changed':
            return { title: 'Changed the password' };
        case 'password_reset':
            return { title: 'Reset the password' };
        case 'email_change_requested':
            return {
                title: 'Asked to change the email address',
                detail: 'It changes once the new address confirms.',
            };
        case 'email_changed':
            return { title: 'Changed the email address' };
        case 'email_change_reverted':
            return {
                title: 'Undid a change to the email address',
                detail: 'From the link sent to the old address.',
            };
        // These name the device that was signed out, not the one that
        // signed it out, so the device goes here and not beside the IP.
        case 'device_revoked':
            return { title: 'Signed out a device', detail: event.device };
        case 'device_reported':
            return {
                title: 'Signed out a device from a “this wasn’t me” link',
                detail: event.device,
            };
        case 'sessions_revoked':
            return {
                title: 'Signed out other sessions',
                detail:
                    meta.count === undefined
                        ? null
                        : `${plural(meta.count, 'session', 'sessions')} ended.`,
            };
        case 'session_ended':
            return {
                title: 'A session was ended',
                detail: endedBecause[meta.reason ?? ''],
            };
        case 'remember_me_reused':
            return {
                title: 'A “remember me” cookie was used twice',
                detail: 'The session ended in both browsers.',
            };
        case 'access_refused':
            return {
                title:
                    refusedAccess[meta.resource ?? ''] ??
                    'Asked for something that isn’t this account’s',
            };
        case 'link_refused':
            return {
                title: 'An emailed link was refused',
                detail: linkRefusedBecause[meta.reason ?? ''],
            };
        case 'verification_refused':
            return { title: 'A sign in was refused by a safeguard' };
        case 'refusals_limited':
            return { title: 'More refusals followed, and weren’t listed' };
        case 'protection_bypassed':
            return {
                title: 'A protected detail was changed outside the usual flow',
                detail: meta.reason,
            };
        case 'clone_suspected':
            return {
                title: 'A security key looked like a copy',
                detail: meta.name,
            };
        default:
            return { title: event.type.replaceAll('_', ' ') };
    }
}

/**
 * Entries whose device is the one they're about (shown as the detail), so
 * the IP beside it is where the request came from, not that device's.
 */
function namesDevice(type: string): boolean {
    return type === 'device_revoked' || type === 'device_reported';
}

function iconFor(type: string): LucideIcon {
    if (/^(signed_in|confirmed|session_resumed|new_device)$/.test(type)) {
        return LogIn;
    }

    if (/^(signed_out|session_ended|sessions_revoked|device_)/.test(type)) {
        return LogOut;
    }

    if (type.startsWith('email_')) {
        return Mail;
    }

    if (/^(authenticator_|recovery_|password_)/.test(type)) {
        return KeyRound;
    }

    return ShieldAlert;
}

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
                description="Sign ins, security changes and anything that was refused on your account. Entries are kept for 180 days."
            />

            <ul className="divide-y rounded-lg border">
                {activity.map((event) => {
                    const { title, detail } = describe(event);
                    const Icon = iconFor(event.type);
                    const severity = severities[event.severity];
                    const where = namesDevice(event.type)
                        ? event.ip && `From ${event.ip}`
                        : [event.device, event.ip].filter(Boolean).join(' · ');

                    return (
                        <li key={event.id} className="flex gap-3 px-4 py-3">
                            <Icon
                                className={
                                    event.severity === 'warning' ||
                                    event.severity === 'critical'
                                        ? 'mt-0.5 size-4 shrink-0 text-destructive'
                                        : 'mt-0.5 size-4 shrink-0 text-muted-foreground'
                                }
                                aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                                    {title}
                                    {severity && (
                                        <Badge variant={severity.variant}>
                                            {severity.label}
                                        </Badge>
                                    )}
                                </p>
                                {detail && (
                                    <p className="text-sm text-muted-foreground">
                                        {detail}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {where && `${where} · `}
                                    <time
                                        dateTime={event.at}
                                        title={fullDate(event.at)}
                                    >
                                        {ago(event.at)}
                                    </time>
                                </p>
                            </div>
                        </li>
                    );
                })}
                {activity.length === 0 && (
                    <li className="px-4 py-3 text-sm text-muted-foreground">
                        Nothing yet.
                    </li>
                )}
            </ul>
        </div>
    );
}
