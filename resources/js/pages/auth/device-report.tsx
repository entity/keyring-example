import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    device: string;
    url: string;
};

/**
 * The "this wasn't me" link from a new sign-in email opens this page.
 * Nothing happens until the button is pressed, so mail scanners that open
 * links can't sign anyone out.
 */
export default function DeviceReport({ device, url }: Props) {
    return (
        <>
            <Head title="Secure your account" />

            <Form action={url} method="post" className="grid gap-6 text-center">
                {({ processing }) => (
                    <>
                        <p className="text-sm text-muted-foreground">
                            This signs out {device} and every “remember me”
                            sign-in. Change your password afterwards if you
                            think someone knows it.
                        </p>

                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={processing}
                            className="w-full"
                        >
                            {processing && <Spinner />}
                            Sign that device out
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

DeviceReport.layout = {
    title: 'Wasn’t you?',
    description: 'Someone signed in to your account from a new device.',
};
