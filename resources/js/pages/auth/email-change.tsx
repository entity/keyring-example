import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    action: 'confirm' | 'revert';
    url: string;
};

/**
 * Emailed links open this page. Nothing changes until the button is pressed,
 * so mail scanners that open links can't confirm or revert anything.
 */
export default function EmailChange({ action, url }: Props) {
    const confirming = action === 'confirm';

    return (
        <>
            <Head
                title={
                    confirming ? 'Confirm email change' : 'Undo email change'
                }
            />

            <Form action={url} method="post" className="grid gap-6 text-center">
                {({ processing }) => (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {confirming
                                ? 'Press the button to confirm this email address change.'
                                : 'Didn’t ask for this? Undo it to put your old address back. Every session will be signed out, and sign-in methods added since the change will be removed.'}
                        </p>

                        <Button
                            type="submit"
                            variant={confirming ? 'default' : 'destructive'}
                            disabled={processing}
                            className="w-full"
                        >
                            {processing && <Spinner />}
                            {confirming
                                ? 'Confirm the change'
                                : 'This wasn’t me, undo it'}
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

EmailChange.layout = {
    title: 'Email address change',
    description: 'Someone asked to change the email address on your account.',
};
