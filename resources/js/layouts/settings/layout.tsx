import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                <aside className="w-full lg:w-44 lg:shrink-0">
                    <nav
                        className="-mx-1 flex gap-1 overflow-x-auto p-1 lg:flex-col"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const current = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    aria-current={current ? 'page' : undefined}
                                    className={cn(
                                        'flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-sidebar-foreground transition-[background-color,color,box-shadow] duration-150 ease-out-quint outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring',
                                        current &&
                                            'bg-raised font-medium text-foreground shadow-raised hover:bg-raised',
                                    )}
                                >
                                    {item.icon && (
                                        <item.icon className="size-4" />
                                    )}
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1 lg:max-w-2xl">
                    <section className="space-y-6">{children}</section>
                </div>
            </div>
        </div>
    );
}
