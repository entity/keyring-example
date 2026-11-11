// Components
import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

/**
 * For someone who is signed in before verifying their address. With this
 * app's registration nobody is (a new user can only sign in once they've
 * followed the emailed link), so this page is only reached with the
 * keyring.registration.reveal_taken option on. `status` is Keyring's message,
 * already translated.
 */
export default function VerifyEmail({ status }: { status?: string | null }) {
    return (
        <>
            <Head title="Email verification" />

            {status && (
                <div
                    role="status"
                    className="mb-4 text-center text-sm font-medium text-green-600"
                >
                    {status}
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
