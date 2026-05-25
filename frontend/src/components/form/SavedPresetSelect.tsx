import { type FC, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { History, X } from 'lucide-react';
import type { RecordFull, FormRecord } from '@/types/api.dto';
import { LOCATION_FIELDS, EVENT_FIELDS, locationSummary, eventSummary } from '@/types/recordLabels';

type PresetType = 'location' | 'event';

interface Props {
    type: PresetType;
    otherRecords: RecordFull[];
}

interface Preset {
    label: string;
    sourceIndex: number;
    data: Partial<RecordFull>;
}

const FIELD_KEYS: Record<PresetType, readonly string[]> = {
    location: LOCATION_FIELDS as unknown as string[],
    event: EVENT_FIELDS as unknown as string[],
};

const LABEL_BUILDERS: Record<PresetType, (d: RecordFull) => string> = {
    location: locationSummary,
    event: eventSummary,
};

const BUTTON_TEXT: Record<PresetType, string> = {
    location: 'Заполнить как у другой записи (место)',
    event: 'Заполнить как у другой записи (событие)',
};

const SavedPresetSelect: FC<Props> = ({ type, otherRecords }) => {
    const { setValue } = useFormContext<FormRecord>();
    const [isOpen, setIsOpen] = useState(false);

    const presets = useMemo(() => {
        if (!otherRecords || otherRecords.length <= 1) return [];

        const fields = FIELD_KEYS[type];
        const buildLabel = LABEL_BUILDERS[type];
        const seen = new Set<string>();
        const result: Preset[] = [];

        otherRecords.forEach((record, idx) => {
            const hasData = fields.some((f) => {
                const val = (record as Record<string, unknown>)[f];
                return val !== null && val !== undefined && val !== '';
            });
            if (!hasData) return;

            const data: Partial<RecordFull> = {};
            for (const f of fields) {
                (data as Record<string, unknown>)[f] = (record as Record<string, unknown>)[f];
            }

            const hash = JSON.stringify(data);
            if (seen.has(hash)) return;
            seen.add(hash);

            const label = buildLabel(record);
            result.push({ label, sourceIndex: idx, data });
        });

        return result;
    }, [otherRecords, type]);

    if (presets.length === 0) return null;

    const handleSelect = (value: string) => {
        const idx = parseInt(value, 10);
        const preset = presets.find((p) => p.sourceIndex === idx);
        if (!preset) return;

        const fields = FIELD_KEYS[type];
        for (const f of fields) {
            const val = (preset.data as Record<string, unknown>)[f] as string | null | undefined;
            setValue(f as keyof FormRecord, val ?? null, { shouldDirty: true });
        }
        setIsOpen(false);
    };

    if (isOpen) {
        return (
            <div className="mb-4 flex items-center gap-2">
                <div className="flex-1">
                    <Select
                        onValueChange={handleSelect}
                        defaultValue=""
                        onOpenChange={(open) => {
                            if (!open) setIsOpen(false);
                        }}
                        defaultOpen={true}
                    >
                        <SelectTrigger className="h-10 w-full border-blue-200 bg-blue-50 text-sm">
                            <SelectValue placeholder="Выберите запись для копирования…" />
                        </SelectTrigger>
                        <SelectContent>
                            {presets.map((p) => (
                                <SelectItem key={p.sourceIndex} value={String(p.sourceIndex)}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-blue-600">
                                            #{presets.length - p.sourceIndex}
                                        </span>
                                        <span className="text-slate-700">{p.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-10 w-10 p-0 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Отменить"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                    setIsOpen(true);
                }}
                className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            >
                <History className="h-4 w-4" />
                {BUTTON_TEXT[type]}
            </Button>
        </div>
    );
};

export default SavedPresetSelect;
