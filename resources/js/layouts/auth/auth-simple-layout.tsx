import { Link, usePage } from '@inertiajs/react';
import AppLogoMark from '@/components/app-logo-mark';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

/**
 * entity/ui's sign-in screen: a soft blue backdrop, the logo and name above
 * a raised card. Pages that draw their own heading (the challenge) leave
 * the title out.
 */
export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-auth-backdrop px-4 py-10 sm:px-6">
            <div className="flex w-full max-w-[400px] flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2.5 self-center rounded-lg text-[15px] font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                    <AppLogoMark />
                    {name}
                </Link>

                <main className="rounded-2xl bg-card p-6 text-card-foreground shadow-dialog sm:p-8">
                    {title && (
                        <div className="mb-6 space-y-1.5 text-center">
                            <h1 className="text-xl font-medium tracking-tight">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-balance text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
