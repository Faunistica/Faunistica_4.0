import { type FC, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Section } from '@/hooks/useInstructions';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface InstructionsSidebarProps {
    sections: Section[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}

export const InstructionsSidebar: FC<InstructionsSidebarProps> = ({
    sections,
    activeSection,
    onSectionClick,
}) => {
    const { t } = useTranslation();
    const { isMobile, setOpenMobile, openMobile } = useSidebar();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scroll = () => {
            if (!scrollRef.current) return;
            if (activeSection) {
                const el = scrollRef.current.querySelector(
                    `button[data-section="${activeSection}"]`,
                );
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else {
                scrollRef.current.scrollTop = 0;
            }
        };

        if (isMobile && openMobile) {
            const timer = setTimeout(scroll, 250);
            return () => clearTimeout(timer);
        }

        if (!isMobile) {
            scroll();
        }
    }, [activeSection, isMobile, openMobile]);

    return (
        <Sidebar variant="sidebar" className="border-r border-slate-200">
            <SidebarHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                    {isMobile ? (
                        <div className="flex items-center gap-2">
                            <div>
                                <div className="text-sm/tight font-bold text-slate-900">
                                    {t('instructions.title')}
                                </div>
                                <div className="text-[10px] leading-tight font-medium text-slate-500">
                                    {t('instructions.tableOfContents')}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <span className="h-12" />
                    )}
                    {isMobile && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-slate-400 hover:text-slate-600 md:hidden"
                            onClick={() => setOpenMobile(false)}
                            aria-label={t('form.sidebarSection.closePanel')}
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="overflow-y-hidden p-0">
                    <SidebarGroupLabel className="rounded-none border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-500 uppercase shadow-xs">
                        <span className="py-1 pl-2">{t('instructions.tableOfContents')}</span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent
                        ref={scrollRef}
                        className="no-scrollbar overflow-y-scroll overscroll-contain p-2 pb-8"
                    >
                        <SidebarMenu className="gap-1.5 px-2 pt-1">
                            {sections.map((section) => {
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        data-section={section.id}
                                        onClick={() => onSectionClick(section.id)}
                                        className={cn(
                                            'group flex w-full cursor-pointer items-center justify-start rounded-md px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                        )}
                                    >
                                        <span className="line-clamp-2">{section.title}</span>
                                    </button>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
};
