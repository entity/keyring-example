import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import StatusMessage from '@/components/status-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InsetCard,
    InsetCardBody,
    InsetCardDescription,
    InsetCardHeader,
    InsetCardTitle,
} from '@/components/ui/inset-card';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type Props = {
    mustVerifyEmail: boolean;
    pendingEmail: {
        email: string;
        confirmed: boolean;
        needsCurrentConfirmation: boolean;
        expiresAt: string;
    } | null;
};

export default function Profile({ mustVerifyEmail, pendingEmail }: Props) {
    const { auth, statusMessage } = usePage<{
        auth: Auth;
        statusMessage: string | null;
    }>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <InsetCard aria-labelledby="profile">
                <InsetCardHeader>
                    <div>
                        <InsetCardTitle id="profile">Profile</InsetCardTitle>
                        <InsetCardDescription>
                            Update your name
                        </InsetCardDescription>
                    </div>
                </InsetCardHeader>

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-4 rounded-lg bg-card p-4 shadow-inset"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    className="block w-full sm:max-w-sm"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <Button
                                disabled={processing}
                                data-test="update-profile-button"
                            >
                                Save
                            </Button>
                        </>
                    )}
                </Form>
            </InsetCard>

            <InsetCard aria-labelledby="email-address">
                <InsetCardHeader>
                    <div>
                        <InsetCardTitle id="email-address">
                            Email address
                        </InsetCardTitle>
                        <InsetCardDescription>
                            Keyring protects your email: a change has to be
                            confirmed from the new address, and the old one can
                            undo it.
                        </InsetCardDescription>
                    </div>
                </InsetCardHeader>

                <InsetCardBody className="space-y-4 p-4">
                    <p className="text-sm">
                        Currently{' '}
                        <span className="font-medium">{auth.user.email}</span>
                    </p>

                    {mustVerifyEmail &&
                        auth.user.email_verified_at === null && (
                            <p className="text-sm text-muted-foreground">
                                Your email address is unverified.{' '}
                                <Link
                                    href={send()}
                                    as="button"
                                    className="text-foreground underline underline-offset-4"
                                >
                                    Re-send the verification email.
                                </Link>
                            </p>
                        )}

                    {pendingEmail ? (
                        <div className="space-y-3 rounded-lg bg-tint p-4 text-sm inset-ring inset-ring-border">
                            <p>
                                Changing to{' '}
                                <span className="font-medium">
                                    {pendingEmail.email}
                                </span>
                                .{' '}
                                {pendingEmail.confirmed
                                    ? 'The new address is confirmed.'
                                    : 'Waiting for the new address to confirm.'}{' '}
                                {pendingEmail.needsCurrentConfirmation &&
                                    'Your current address needs to confirm too.'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    router.delete('/user/email', {
                                        preserveScroll: true,
                                    })
                                }
                            >
                                Cancel the change
                            </Button>
                        </div>
                    ) : (
                        <Form
                            action="/user/email"
                            method="post"
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            New email address
                                        </Label>
                                        <Input
                                            id="email"
                                            className="sm:max-w-sm"
                                            type="email"
                                            name="email"
                                            required
                                            autoComplete="email"
                                            placeholder="new@example.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <Button disabled={processing}>
                                        Send confirmation
                                    </Button>
                                </>
                            )}
                        </Form>
                    )}

                    {statusMessage && (
                        <StatusMessage>{statusMessage}</StatusMessage>
                    )}
                </InsetCardBody>
            </InsetCard>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
