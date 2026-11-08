import { KeyringRequestError } from '@entity/keyring/react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { statusMessage } from '@/keyring/status';

/**
 * Run one of Keyring's JSON calls from the security page.
 *
 * - 423 means the change needs a fresh verification. The security page sits
 *   behind the same keyring.fresh middleware, so reloading it goes through
 *   the confirm page and comes straight back here afterwards.
 * - Other errors become a toast (validation errors use their first message).
 * - On success the page's data is reloaded so the lists stay current. Pass
 *   `reload: false` while a dialog still needs its state (a reload remounts
 *   the page), and reload when it closes.
 */
export async function run<T>(
    call: () => Promise<T>,
    success?: string,
    { reload = true }: { reload?: boolean } = {},
): Promise<T | null> {
    try {
        const result = await call();

        if (success) {
            toast.success(statusMessage(success) ?? success);
        }

        if (reload) {
            router.reload();
        }

        return result;
    } catch (error) {
        if (error instanceof KeyringRequestError && error.status === 423) {
            router.visit(window.location.pathname);

            return null;
        }

        if (error instanceof KeyringRequestError) {
            toast.error(Object.values(error.errors)[0]?.[0] ?? error.message);
        } else if (
            !(error instanceof DOMException && error.name === 'NotAllowedError')
        ) {
            // NotAllowedError is the browser's "cancelled", not worth a toast.
            toast.error(error instanceof Error ? error.message : String(error));
        }

        return null;
    }
}
