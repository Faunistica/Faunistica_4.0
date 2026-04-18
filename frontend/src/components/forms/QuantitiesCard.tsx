import { type FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { InsertRecordsRequest } from "@/types/api.dto";

interface Props {
    data?: Partial<InsertRecordsRequest>;
    updateData?: (updates: Partial<InsertRecordsRequest>) => void;
}

const QuantitiesCard: FC<Props> = ({ data = {}, updateData }) => {
    const specs = data.specimens || {};
    const setSpec = (key: string, val: string) => {
        updateData?.({
            specimens: { ...specs, [key]: val ? parseInt(val, 10) : null }
        });
    };

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Количественные характеристики</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="mmm">Самцов</Label>
                            <Input id="mmm" type="number" min="0" max="255" value={specs.mmm ?? 0} onChange={e => setSpec('mmm', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ssm">Субвзрослых самцов</Label>
                            <Input id="ssm" type="number" min="0" max="255" value={specs.ssm ?? 0} onChange={e => setSpec('ssm', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fff">Самок</Label>
                            <Input id="fff" type="number" min="0" max="255" value={specs.fff ?? 0} onChange={e => setSpec('fff', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ssf">Субвзрослых самок</Label>
                            <Input id="ssf" type="number" min="0" max="255" value={specs.ssf ?? 0} onChange={e => setSpec('ssf', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adu">Взрослых (пол не определен)</Label>
                            <Input id="adu" type="number" min="0" max="255" value={specs.adu ?? 0} onChange={e => setSpec('adu', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="juv">Ювенильных</Label>
                            <Input id="juv" type="number" min="0" max="255" value={specs.juv ?? 0} onChange={e => setSpec('juv', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="ind_rem">Дополнительные комментарии</Label>
                        <Textarea 
                            id="ind_rem" 
                            className="min-h-[105px] resize-none" 
                            placeholder="Укажите специфические детали экземпляра..." 
                            value={data.abu_ind_rem || ''}
                            onChange={e => updateData?.({ abu_ind_rem: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuantitiesCard;
