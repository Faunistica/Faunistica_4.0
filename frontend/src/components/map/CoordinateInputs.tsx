import { type FC, memo } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCoordinateInputs } from '@/hooks/useCoordinateInputs';

interface Props {
    prefix: string;
    disabled?: boolean;
}

const CoordinateInput = ({
    value,
    onChange,
    min,
    max,
    step,
    placeholder,
    id,
    error,
    disabled,
}: {
    value: number | '';
    onChange: (val: number | '') => void;
    min: number;
    max: number;
    step?: number;
    placeholder: string;
    id: string;
    error?: string;
    disabled?: boolean;
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val ? Number(val) : '');
    };

    return (
        <div className="flex-1">
            <Input
                id={id}
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(error && 'border-red-500')}
            />
            {error && <span className="mt-0.5 block text-xs text-red-500">{error}</span>}
        </div>
    );
};

const DirectionSelect = ({
    value,
    onChange,
    options,
    id,
    disabled,
}: {
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    id: string;
    disabled?: boolean;
}) => {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger id={id} className="w-24 shrink-0">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
DirectionSelect.displayName = 'DirectionSelect';

export const DMInputGroup: FC<Props> = ({ prefix, disabled }) => {
    const {
        latDeg,
        latMin,
        latDir,
        lonDeg,
        lonMin,
        lonDir,
        setLatDeg,
        setLatMin,
        setLatDir,
        setLonDeg,
        setLonMin,
        setLonDir,
        latError,
        lonError,
    } = useCoordinateInputs(prefix, 'dm');

    return (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor={`lat-deg-${prefix}`}>Широта (градусы° минуты')</Label>
                <div className="flex items-start gap-2">
                    <CoordinateInput
                        id={`lat-deg-${prefix}`}
                        value={latDeg}
                        onChange={setLatDeg}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-min-${prefix}`}
                        value={latMin}
                        onChange={setLatMin}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lat-dir-${prefix}`}
                        value={latDir}
                        onChange={setLatDir}
                        options={[
                            { value: 'N', label: 'N (С.Ш.)' },
                            { value: 'S', label: 'S (Ю.Ш.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`lon-deg-${prefix}`}>Долгота (градусы° минуты')</Label>
                <div className="flex items-start gap-2">
                    <CoordinateInput
                        id={`lon-deg-${prefix}`}
                        value={lonDeg}
                        onChange={setLonDeg}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={lonError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-min-${prefix}`}
                        value={lonMin}
                        onChange={setLonMin}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lon-dir-${prefix}`}
                        value={lonDir}
                        onChange={setLonDir}
                        options={[
                            { value: 'E', label: 'E (В.Д.)' },
                            { value: 'W', label: 'W (З.Д.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

export const DMSInputGroup: FC<Props> = ({ prefix, disabled }) => {
    const {
        latDeg,
        latMin,
        latSec,
        latDir,
        lonDeg,
        lonMin,
        lonSec,
        lonDir,
        setLatDeg,
        setLatMin,
        setLatSec,
        setLatDir,
        setLonDeg,
        setLonMin,
        setLonSec,
        setLonDir,
        latError,
        lonError,
    } = useCoordinateInputs(prefix, 'dms');

    return (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 p-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor={`lat-deg-dms-${prefix}`}>Широта (градусы° минуты' секунды'')</Label>
                <div className="flex flex-wrap items-start gap-2">
                    <CoordinateInput
                        id={`lat-deg-dms-${prefix}`}
                        value={latDeg}
                        onChange={setLatDeg}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-min-dms-${prefix}`}
                        value={latMin}
                        onChange={setLatMin}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-sec-dms-${prefix}`}
                        value={latSec}
                        onChange={setLatSec}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lat-dir-dms-${prefix}`}
                        value={latDir}
                        onChange={setLatDir}
                        options={[
                            { value: 'N', label: 'N (С.Ш.)' },
                            { value: 'S', label: 'S (Ю.Ш.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor={`lon-deg-dms-${prefix}`}>
                    Долгота (градусы° минуты' секунды'')
                </Label>
                <div className="flex flex-wrap items-start gap-2">
                    <CoordinateInput
                        id={`lon-deg-dms-${prefix}`}
                        value={lonDeg}
                        onChange={setLonDeg}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={lonError}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-min-dms-${prefix}`}
                        value={lonMin}
                        onChange={setLonMin}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-sec-dms-${prefix}`}
                        value={lonSec}
                        onChange={setLonSec}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lon-dir-dms-${prefix}`}
                        value={lonDir}
                        onChange={setLonDir}
                        options={[
                            { value: 'E', label: 'E (В.Д.)' },
                            { value: 'W', label: 'W (З.Д.)' },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};
