import { type FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';
import type { InsertRecordsRequest } from "@/types/api.dto";

interface Props {
    data?: Partial<InsertRecordsRequest>;
    updateData?: (updates: Partial<InsertRecordsRequest>) => void;
}

const TaxonomyCard: FC<Props> = ({ data = {}, updateData }) => {
    const isNewSpecies = data.is_new_species || false;
    const setIsNewSpecies = (val: boolean) => updateData?.({ is_new_species: val });

    return (
        <Card className="border-slate-200 shadow-sm relative">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-50">
                <Lock className="h-4 w-4" />
            </Button>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Таксономическая принадлежность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Семейство (Familia)</Label>
                        <Select>
                            <SelectTrigger><SelectValue placeholder="Выберите семейство" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Agelenidae">Agelenidae</SelectItem>
                                <SelectItem value="Lycosidae">Lycosidae</SelectItem>
                                <SelectItem value="Salticidae">Salticidae</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Род (Genus)</Label>
                        <Input
                            placeholder="Название рода"
                            value={data.genus || ''}
                            onChange={(e) => updateData?.({ genus: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Вид (Species)</Label>
                        <Input
                            placeholder="Видовой эпитет"
                            value={data.species || ''}
                            onChange={(e) => updateData?.({ species: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Таксономические примечания</Label>
                        <Textarea
                            className="min-h-[40px] resize-none"
                            value={data.taxonomic_notes || ''}
                            onChange={(e) => updateData?.({ taxonomic_notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sp_def" defaultChecked />
                        <Label htmlFor="sp_def" className="font-normal">Вид достоверно определен</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="notinlist" />
                        <Label htmlFor="notinlist" className="font-normal">Отсутствует в номенклатурном списке</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="taxa_nsp"
                            checked={isNewSpecies}
                            onCheckedChange={(c) => setIsNewSpecies(c as boolean)}
                        />
                        <Label htmlFor="taxa_nsp" className="font-normal">sp. n. (новый таксон)</Label>
                    </div>

                    {isNewSpecies && (
                        <div className="flex-1 min-w-[200px]">
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Типовой статус" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="holotype">Голотип</SelectItem>
                                    <SelectItem value="paratype">Паратип</SelectItem>
                                    <SelectItem value="neotype">Неотип</SelectItem>
                                    <SelectItem value="other">Иное</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TaxonomyCard;
