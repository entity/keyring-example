import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import {
    InsetCard,
    InsetCardBody,
    InsetCardDescription,
    InsetCardHeader,
    InsetCardTitle,
} from '@/components/ui/inset-card';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <InsetCard aria-labelledby="appearance">
                <InsetCardHeader>
                    <div>
                        <InsetCardTitle id="appearance">
                            Appearance settings
                        </InsetCardTitle>
                        <InsetCardDescription>
                            Update the appearance settings for your account
                        </InsetCardDescription>
                    </div>
                </InsetCardHeader>
                <InsetCardBody className="p-4">
                    <AppearanceTabs />
                </InsetCardBody>
            </InsetCard>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
