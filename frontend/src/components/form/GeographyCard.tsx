import { type FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Map as MapIcon } from 'lucide-react';
import type { InsertRecordsRequest } from "@/types/api.dto";

interface Props {
    data?: Partial<InsertRecordsRequest>;
    updateData?: (updates: Partial<InsertRecordsRequest>) => void;
}

const GeographyCard: FC<Props> = ({ data = {}, updateData }) => {
    return (
        <Card className="border-slate-200 shadow-sm relative">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-50">
                <Lock className="h-4 w-4" />
            </Button>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Пространственная локализация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-b border-slate-100 pb-6">
                    <div className="lg:col-span-1 space-y-2">
                        <Label>Геокоординаты</Label>
                        <div className="h-28 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                            <MapIcon className="mr-2 h-5 w-5" />
                            <span className="text-sm">Картографический модуль</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label>Происхождение координат</Label>
                        <RadioGroup defaultValue="original">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="original" id="geo_orig" />
                                <Label htmlFor="geo_orig" className="font-normal text-slate-700">Из источника (оригинальные)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="volunteer" id="geo_vol" />
                                <Label htmlFor="geo_vol" className="font-normal text-slate-700">Собственная геопривязка</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nothing" id="geo_none" />
                                <Label htmlFor="geo_none" className="font-normal text-slate-700">Данные отсутствуют</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Географические примечания</Label>
                        <Textarea 
                            className="h-28 resize-none" 
                            value={data.geo_REM || ''}
                            onChange={(e) => updateData?.({ geo_REM: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Государство</Label>
                        <Input 
                            value={data.country || 'Россия'} 
                            onChange={(e) => updateData?.({ country: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Регион (Субъект)</Label>
                        <Input 
                            placeholder="Выберите регион" 
                            value={data.region || ''}
                            onChange={(e) => updateData?.({ region: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Район (Муниципалитет)</Label>
                        <Input 
                            placeholder="Выберите район" 
                            value={data.district || ''}
                            onChange={(e) => updateData?.({ district: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Локалитет (Топоним)</Label>
                        <Input 
                            placeholder="Точное место сбора" 
                            value={data.place || ''}
                            onChange={(e) => updateData?.({ place: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="urals" defaultChecked />
                        <Label htmlFor="urals" className="font-normal">Относится к Уральскому макрорегиону</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="adm_lng" defaultChecked />
                        <Label htmlFor="adm_lng" className="font-normal">Русскоязычная номенклатура (кириллица)</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GeographyCard;
