import { Form } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Button } from '@/components/ui/button';
import {
    InsetCard,
    InsetCardBody,
    InsetCardDescription,
    InsetCardHeader,
    InsetCardTitle,
} from '@/components/ui/inset-card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function DeleteUser() {
    return (
        <InsetCard aria-labelledby="delete-account">
            <InsetCardHeader>
                <div>
                    <InsetCardTitle id="delete-account">
                        Delete account
                    </InsetCardTitle>
                    <InsetCardDescription>
                        Delete your account and all of its resources
                    </InsetCardDescription>
                </div>
            </InsetCardHeader>
            <InsetCardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                    Please proceed with caution, this cannot be undone.
                </p>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            className="shrink-0 self-start text-destructive-foreground sm:self-auto"
                            data-test="delete-user-button"
                        >
                            Delete account
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>
                            Are you sure you want to delete your account?
                        </DialogTitle>
                        <DialogDescription>
                            Once your account is deleted, all of its resources
                            and data will also be permanently deleted. If it's
                            been a while since you signed in, we'll ask you to
                            confirm it's you first.
                        </DialogDescription>

                        <Form
                            {...ProfileController.destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="space-y-6"
                        >
                            {({ resetAndClearErrors, processing }) => (
                                <>
                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    resetAndClearErrors()
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Delete account
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </InsetCardBody>
        </InsetCard>
    );
}
