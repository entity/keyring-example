import { confirmEnrollment } from '@keyringjs/keyring/react';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import type { Recovery } from '@/components/keyring/sign-in-methods';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useClipboard } from '@/hooks/use-clipboard';
import { run } from '@/keyring/actions';

/**
 * Shows recovery codes once. Fresh codes from "Make new codes" only replace
 * the old ones after the user confirms they saved them.
 */
export default function RecoveryCodesDialog({
    recovery,
    signOutOthers = false,
    onClose,
}: {
    recovery: Recovery;
    /** Also end the account's other sessions when a new set is saved. */
    signOutOthers?: boolean;
    onClose: () => void;
}) {
    const [, copy] = useClipboard();
    const [saving, setSaving] = useState(false);

    async function done() {
        if (recovery?.enrollment) {
            setSaving(true);
            const saved = await run(
                () =>
                    confirmEnrollment('recovery', recovery.enrollment!, {
                        sign_out_others: signOutOthers,
                    }),
                { success: 'New recovery codes saved.', reload: false },
            );
            setSaving(false);

            if (!saved) {
                return;
            }
        }

        onClose();
    }

    return (
        <Dialog
            open={recovery !== null}
            onOpenChange={(open) => !open && !recovery?.enrollment && onClose()}
        >
            <DialogContent
                // Codes are shown once, so only the buttons close this.
                onInteractOutside={(event) => event.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Save your recovery codes</DialogTitle>
                    <DialogDescription>
                        Each code works once. Keep them somewhere safe, like a
                        password manager. They get you in if you lose your other
                        sign-in methods.
                    </DialogDescription>
                </DialogHeader>

                <ul className="grid gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
                    {recovery?.codes.map((code) => (
                        <li key={code}>{code}</li>
                    ))}
                </ul>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            void copy(recovery?.codes.join('\n') ?? '')
                        }
                    >
                        <Copy />
                        Copy
                    </Button>
                    <Button onClick={() => void done()} disabled={saving}>
                        {saving && <Spinner />}
                        {recovery?.continue
                            ? 'I’ve saved these, continue'
                            : 'I’ve saved these'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
