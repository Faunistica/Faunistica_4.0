import { type FC, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import type { RecordFull, FormRecord } from '@/types/api.dto';
import { LOCATION_FIELDS, EVENT_FIELDS, locationSummary, eventSummary } from '@/types/recordLabels';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SharedField = keyof RecordFull & keyof FormRecord;

type PresetType = 'location' | 'event';

interface Props {
    type: PresetType;
    otherRecords: RecordFull[];
}

interface Preset {
    label: string;
    sourceIndex: number;
}

const FIELD_KEYS: Record<PresetType, SharedField[]> = {
    location: LOCATION_FIELDS,
    event: EVENT_FIELDS,
};

const LABEL_BUILDERS: Record<PresetType, (d: RecordFull) => string> = {
    location: locationSummary,
    event: eventSummary,
};

const SavedPresetSelect: FC<Props> = ({ type, otherRecords }) => {
    const { setValue } = useFormContext<FormRecord>();

    const presets = useMemo(() => {
        if (!otherRecords || otherRecords.length <= 1) return [];

        const fields = FIELD_KEYS[type];
        const buildLabel = LABEL_BUILDERS[type];
        const seen = new Set<string>();
        const result: Preset[] = [];

        otherRecords.forEach((record, idx) => {
            const hasData = fields.some((f) => {
                const val = record[f];
                return val !== null && val !== undefined && val !== '';
            });
            if (!hasData) return;

            const hash = JSON.stringify(fields.map((f) => record[f]));
            if (seen.has(hash)) return;
            seen.add(hash);

            result.push({ label: buildLabel(record), sourceIndex: idx });
        });

        return result;
    }, [otherRecords, type]);

    if (presets.length === 0) return null;

    const handleSelect = (index: number) => {
        const preset = presets.find((p) => p.sourceIndex === index);
        if (!preset) return;

        const source = otherRecords[preset.sourceIndex];
        if (!source) return;

        const fields = FIELD_KEYS[type];
        for (const f of fields) {
            setValue(f, source[f] ?? null, { shouldDirty: true });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="my-auto border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                    <History className="h-4 w-4" />
                    Заполнить как у другой записи
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit" align="end">
                {presets.map((p) => (
                    <DropdownMenuItem
                        key={p.sourceIndex}
                        onSelect={() => handleSelect(p.sourceIndex)}
                        className="flex items-center gap-2"
                    >
                        <span className="w-6 text-xs font-semibold text-blue-600">
                            #{presets.length - p.sourceIndex}
                        </span>
                        <span className="text-slate-700">{p.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SavedPresetSelect;
