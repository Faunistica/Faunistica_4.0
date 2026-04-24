import { type FC, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';
import type { InsertRecordsRequest } from "@/types/api.dto";

interface Props {
    data?: Partial<InsertRecordsRequest>;
    updateData?: (updates: Partial<InsertRecordsRequest>) => void;
}

const CollectionEventCard: FC<Props> = ({ data = {}, updateData }) => {
    const [dateRange, setDateRange] = useState(false);

    return (
        <Card className="border-slate-200 shadow-sm relative">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-50">
                <Lock className="h-4 w-4" />
            </Button>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Параметры сбора материала (Событие)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Год</Label>
                                <Input type="number" min="1770" max="2024" placeholder="YYYY" />
                                {dateRange && <Input type="number" className="mt-2" placeholder="YYYY (конец)" />}
                            </div>
                            <div className="space-y-2">
                                <Label>Месяц</Label>
                                <Input type="number" min="1" max="12" placeholder="MM" />
                                {dateRange && <Input type="number" className="mt-2" placeholder="MM (конец)" />}
                            </div>
                            <div className="space-y-2">
                                <Label>День</Label>
                                <Input type="number" min="1" max="31" placeholder="DD" />
                                {dateRange && <Input type="number" className="mt-2" placeholder="DD (конец)" />}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="date_range" checked={dateRange} onCheckedChange={(c) => setDateRange(c as boolean)} />
                                <Label htmlFor="date_range" className="text-sm font-normal">Временной интервал</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="month_def" defaultChecked />
                                <Label htmlFor="month_def" className="text-sm font-normal">Месяц определен</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="day_def" defaultChecked />
                                <Label htmlFor="day_def" className="text-sm font-normal">День определен</Label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Биотоп</Label>
                                <Input 
                                    placeholder="Описание местообитания" 
                                    value={data.biotope || ''}
                                    onChange={(e) => updateData?.({ biotope: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Коллектор</Label>
                                <Input 
                                    placeholder="Фамилия И.О." 
                                    value={data.collector || ''}
                                    onChange={(e) => updateData?.({ collector: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Единицы измерения</Label>
                                <Input 
                                    value={data.measurement_units || 'особи, шт.'} 
                                    onChange={(e) => updateData?.({ measurement_units: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Выборочное усилие</Label>
                                <Input placeholder="Например: 20 лов-сут" />
                            </div>
                        </div>
                        <div className="space-y-2 h-full">
                            <Label>Примечания к событию</Label>
                            <Textarea 
                                className="h-32 resize-none" 
                                placeholder="Методика сбора, погодные условия и т.д." 
                                value={data.eve_REM || ''}
                                onChange={(e) => updateData?.({ eve_REM: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CollectionEventCard;
