import { type FC } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from 'lucide-react';
import type { InsertRecordsRequest } from "@/types/api.dto";

interface Props {
    data?: Partial<InsertRecordsRequest>;
    updateData?: (updates: Partial<InsertRecordsRequest>) => void;
}

const ArticleSourceCard: FC<Props> = () => {
    return (
        <Card className="border-slate-300 shadow-sm bg-white relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-800"></div>
            <CardHeader className="pl-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">Источник данных</Badge>
                            <span className="text-xs text-slate-500 font-mono">ID: PUB-2023-891</span>
                        </div>
                        <CardTitle className="text-lg md:text-xl leading-tight text-slate-900">
                            Материалы к фауне пауков (Aranei) Южного Урала. Новые находки и таксономические замечания.
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Иванов А.В., Смирнов П.Н. (2023) // Зоологический журнал. Том 102, №4, стр. 415-430.
                        </CardDescription>
                    </div>
                    <Button variant="outline" className="shrink-0 gap-2 border-slate-300 w-full md:w-auto">
                        <FileText className="h-4 w-4" />
                        Открыть PDF
                    </Button>
                </div>
            </CardHeader>
        </Card>
    );
};

export default ArticleSourceCard;
