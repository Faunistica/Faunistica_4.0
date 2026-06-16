import { type FC } from 'react';
import { useOutletContext } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingScreen from '@/components/LoadingScreen';
import { SidebarProvider } from '@/components/ui/sidebar';

import { useInstructions } from '@/hooks/useInstructions';
import { InstructionsSidebar } from '@/components/instructions/InstructionsSidebar';
import { MarkdownContent } from '@/components/instructions/MarkdownContent';
import { useTranslation } from 'react-i18next';

interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Instructions: FC = () => {
    const { t } = useTranslation();
    const context = useOutletContext<OutletContextType | null>();
    const isSidebarOpen = context?.isSidebarOpen ?? false;
    const setIsSidebarOpen = context?.setIsSidebarOpen ?? (() => {});

    const { loading, error, activeSection, sections, scrollToSection } = useInstructions();

    const handleSectionClick = (id: string) => {
        scrollToSection(id, () => setIsSidebarOpen(false));
    };

    if (loading) return <LoadingScreen />;

    if (error) {
        return (
            <div className="flex min-h-[60vh] w-full flex-1 items-center justify-center">
                <p className="text-muted-foreground">{t('instructions.error')}</p>
            </div>
        );
    }

    return (
        <SidebarProvider
            open={true}
            openMobile={isSidebarOpen}
            onOpenMobileChange={setIsSidebarOpen}
        >
            <InstructionsSidebar
                sections={sections}
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
            />

            <main className="relative flex w-full min-w-0 flex-1 flex-col">
                <div className="mx-auto w-full max-w-5xl space-y-8 p-4 pb-24 md:p-8">
                    {sections.map((section) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-2xl">{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="prose prose-sm max-w-none md:prose-base dark:prose-invert prose-headings:font-semibold prose-img:m-0">
                                    <MarkdownContent content={section.content} />
                                </CardContent>
                            </Card>
                        </section>
                    ))}
                </div>
            </main>
        </SidebarProvider>
    );
};

export default Instructions;
