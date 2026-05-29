import { type FC, useCallback } from 'react';
import { useFormContext, type FieldPath } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import type { RecordFull, FormRecord } from '@/types/api.dto';
import { LOCATION_FIELDS, EVENT_FIELDS, locationSummary, eventSummary } from '@/types/recordLabels';
import { recordAPI } from '@/api/recordAPI';
import { useAppSelector } from '@/store/store';
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
    publ_id: number;
    activeRecordId: string | null;
}

interface Preset {
    label: string;
    recordId: string;
}

const FIELD_KEYS: Record<PresetType, SharedField[]> = {
    location: LOCATION_FIELDS,
    event: EVENT_FIELDS,
};

const LABEL_BUILDERS: Record<PresetType, (d: RecordFull) => string> = {
    location: locationSummary,
    event: eventSummary,
};

const SavedPresetSelect: FC<Props> = ({ type, publ_id, activeRecordId }) => {
    const { setValue } = useFormContext<FormRecord>();

    const presets = useAppSelector(
        (state) => {
            const result = recordAPI.endpoints.recordsList.select({
                publ_id,
            })(state);
            const items = 'data' in result ? (result.data?.items ?? []) : [];
            const fields = FIELD_KEYS[type];
            const buildLabel = LABEL_BUILDERS[type];
            const seen = new Set<string>();
            const resultList: Preset[] = [];

            for (const record of items) {
                if (activeRecordId && record.id === activeRecordId) continue;

                const hasData = fields.some((f) => {
                    const val = record[f];
                    return val !== null && val !== undefined && val !== '';
                });
                if (!hasData) continue;

                const hash = JSON.stringify(fields.map((f) => record[f]));
                if (seen.has(hash)) continue;
                seen.add(hash);

                const label = buildLabel(record);
                if (label.length === 0) continue;

                resultList.push({ label: label, recordId: record.id });
            }

            return resultList;
        },
        (a, b) => {
            if (a === b) return true;
            if (a.length !== b.length) return false;
            return a.every((p, i) => p.label === b[i].label && p.recordId === b[i].recordId);
        },
    );

    // Get a map of all records for O(1) lookup in handleSelect
    const recordMap = useAppSelector(
        (state) => {
            const userId = state.user.user_id;
            if (!userId) return new Map<string, RecordFull>();

            const result = recordAPI.endpoints.recordsList.select({
                publ_id,
            })(state);
            const items = 'data' in result ? (result.data?.items ?? []) : [];
            return new Map(items.map((r) => [r.id, r]));
        },
        (a, b) => {
            if (a.size !== b.size) return false;
            for (const [k, v] of a) {
                if (!b.has(k) || b.get(k) !== v) return false;
            }
            return true;
        },
    );

    if (presets.length === 0) return null;

    const handleSelect = useCallback(
        (recordId: string) => {
            const source = recordMap.get(recordId);
            if (!source) return;

            const fields = FIELD_KEYS[type];
            for (const f of fields) {
                const val = source[f];
                if (val == null) continue;
                setValue(
                    f as FieldPath<FormRecord>,
                    f === 'latitude' || f === 'longitude' ? Number(val) : val,
                    {
                        shouldDirty: true,
                    },
                );
            }
        },
        [recordMap, setValue, type],
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="my-auto border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                    <History className="size-4" />
                    Заполнить как у другой записи
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit" align="end">
                {presets.map((p) => (
                    <DropdownMenuItem
                        key={p.recordId}
                        onSelect={() => handleSelect(p.recordId)}
                        className="flex items-center gap-2"
                    >
                        <span className="w-6 text-xs font-semibold text-blue-600">
                            #{presets.length - presets.indexOf(p)}
                        </span>
                        <span className="text-slate-700">{p.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SavedPresetSelect;
