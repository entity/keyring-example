import {
    errorMessage,
    isAbort,
    KeyringRequestError,
} from '@keyringjs/keyring/react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

/**
 * Run one of Keyring's JSON calls from the security page.
 *
 * - 423 means the change needs a fresh verification: follow Keyring's
 *   redirect to the confirm page, which comes back here afterwards.
 * - Other errors become a toast (validation errors use their first message).
 *   Closing the browser's passkey prompt isn't an error.
 * - On success, Keyring's message is shown (pass `success` to say something
 *   else, or `false` to stay quiet) and the page's data is reloaded so the
 *   lists stay current. Pass `reload: false` while a dialog still needs its
 *   state (a reload remounts the page), and reload when it closes.
 */
export async function run<T>(
    call: () => Promise<T>,
    {
        success,
        reload = true,
    }: { success?: string | false; reload?: boolean } = {},
): Promise<T | null> {
    try {
        const result = await call();
        const message =
            success ?? (result as { message?: string } | null)?.message;

        if (message) {
            toast.success(message);
        }

        if (reload) {
            router.reload();
        }

        return result;
    } catch (error) {
        if (error instanceof KeyringRequestError && error.status === 423) {
            router.visit(error.data.redirect);

            return null;
        }

        if (error instanceof KeyringRequestError) {
            toast.error(Object.values(error.errors)[0]?.[0] ?? error.message);
        } else if (!isAbort(error)) {
            toast.error(errorMessage(error));
        }

        return null;
    }
}
