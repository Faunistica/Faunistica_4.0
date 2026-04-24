import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, FileText, Trash2, MapPin } from 'lucide-react';
import type { InsertRecordsRequest } from "@/types/api.dto";
import { Link } from "react-router";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    samples?: Partial<InsertRecordsRequest>[];
    activeSampleIndex?: number;
    setActiveSampleIndex?: (index: number) => void;
    addSample?: () => void;
    removeSample?: (index: number) => void;
}

const FormSidebar: FC<SidebarProps> = ({
    samples = [],
    activeSampleIndex = 0,
    setActiveSampleIndex,
    addSample,
    removeSample
}) => {
    return (
        <Sidebar variant="sidebar" className="border-r border-slate-200">
            <SidebarHeader className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-md bg-slate-900 h-8 w-8 text-white">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">Менеджер</div>
                        <div className="text-[10px] text-slate-500 font-medium leading-tight">Образцы записей</div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <div className="p-4 pb-0">
                    <Button onClick={addSample} className="w-full gap-2 font-semibold shadow-sm bg-slate-900 hover:bg-slate-800 text-white" size="sm">
                        <Plus className="h-4 w-4" />
                        Добавить образец
                    </Button>
                </div>

                <SidebarGroup className="mt-2">
                    <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Список образцов</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5 px-2">
                            {samples.map((sample, index) => {
                                const isActive = index === activeSampleIndex;
                                const sampleName = sample.species || sample.genus || sample.family || "Новый образец";
                                const sampleNumber = samples.length - index;

                                return (
                                    <SidebarMenuItem key={index}>
                                        <SidebarMenuButton
                                            isActive={isActive}
                                            onClick={() => setActiveSampleIndex?.(index)}
                                            className={`flex flex-col items-start gap-1 py-3 px-3 h-auto transition-all duration-200 ${isActive ? 'bg-slate-100 shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex w-full items-start justify-between gap-2">
                                                <span className={`text-xs font-bold leading-tight mt-0.5 ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                                                    #{sampleNumber} {sampleName}
                                                </span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 rounded-md hover:bg-red-100 hover:text-red-600 shrink-0 text-slate-400 opacity-100 md:opacity-0 md:group-hover/menu-button:opacity-100 md:data-[active=true]:opacity-100 data-[active=true]:opacity-100 transition-opacity"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Это действие нельзя отменить. Данный образец будет безвозвратно удален.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Отмена</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                variant="destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeSample?.(index);
                                                                }}
                                                            >
                                                                Удалить
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            {isActive ? (
                                                <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-semibold mt-0.5">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                    </span>
                                                    Редактируется
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 w-full mt-0.5">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{sample.place || sample.region || "Нет данных о месте"}</span>
                                                </div>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-100 p-4">
                <Button asChild variant="outline" className="w-full justify-start gap-2 shadow-sm font-medium">
                    <Link to="/dashboard">
                        <LogOut className="h-4 w-4 text-slate-500" />
                        Вернуться назад
                    </Link>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
};

export default FormSidebar;
