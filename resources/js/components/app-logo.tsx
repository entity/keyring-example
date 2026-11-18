import { usePage } from '@inertiajs/react';
import AppLogoMark from '@/components/app-logo-mark';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <AppLogoMark className="size-7 rounded-md" />
            <div className="ml-0.5 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-medium text-foreground">
                    {name}
                </span>
            </div>
        </>
    );
}
