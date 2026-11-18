import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * PUT /user/password, which Keyring answers with a flashed status and a
 * redirect back here. It signs out the other sessions too.
 */
export default function ChangePassword({
    onCancel,
}: {
    /** Left out while the user has to change it before going on. */
    onCancel?: () => void;
}) {
    return (
        <Form
            action="/user/password"
            method="put"
            options={{ preserveScroll: true }}
            resetOnSuccess
            resetOnError={[
                'password',
                'password_confirmation',
                'current_password',
            ]}
            onSuccess={onCancel}
            className="space-y-4"
        >
            {({ errors, processing }) => (
                <>
                    <p className="text-sm text-muted-foreground">
                        Use at least 15 characters, or 8 once you have a second
                        factor. Your other sessions are signed out.
                    </p>

                    <div className="grid gap-2">
                        <Label htmlFor="current_password">
                            Current password
                        </Label>
                        <PasswordInput
                            id="current_password"
                            name="current_password"
                            autoComplete="current-password"
                            autoFocus={onCancel !== undefined}
                        />
                        <InputError message={errors.current_password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">New password</Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            autoComplete="new-password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">
                            Confirm new password
                        </Label>
                        <PasswordInput
                            id="password_confirmation"
                            name="password_confirmation"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button disabled={processing}>Save</Button>
                        {onCancel && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </>
            )}
        </Form>
    );
}
