import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';

type Props = {
    /** The address being verified. */
    email: string;
    /** Where the button posts: the link's address without its signature. */
    url: string;
    expires: string;
    signature: string;
};

/**
 * The link in a verification email opens this page for someone who is signed
 * in. Opening it verifies nothing: the button does, by posting the link's
 * signature in the body, so a mail scanner that fetches the link changes
 * nothing.
 *
 * With this app's registration a new user never sees it. They open the link
 * signed out, are sent to sign in, and signing in from that browser is what
 * verifies their address. It's here for the keyring.registration.reveal_taken
 * option, which signs new users in before they've verified.
 */
export default function EmailVerification({
    email,
    url,
    expires,
    signature,
}: Props) {
    return (
        <>
            <Head title="Verify your email address" />

            <Form
                action={url}
                method="post"
                transform={(data) => ({ ...data, expires, signature })}
                className="grid gap-6 text-center"
            >
                {({ processing }) => (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Press the button to confirm that{' '}
                            <span className="font-medium text-foreground">
                                {email}
                            </span>{' '}
                            is your email address.
                        </p>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full"
                        >
                            {processing && <Spinner />}
                            Verify email address
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Not you? Log out
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

EmailVerification.layout = {
    title: 'Verify your email address',
    description: 'One more step to finish setting up your account.',
};
