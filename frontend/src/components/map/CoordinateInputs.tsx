import { type FC } from 'react';
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

export const DMInputGroup: FC<Props> = ({ prefix, disabled }) => {
    const { latitude, longitude } = useCoordinateInputs(prefix, 'dm');

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor={`lat-deg-${prefix}`}>Широта (градусы° минуты')</Label>
                <div className="flex items-start gap-2">
                    <CoordinateInput
                        id={`lat-deg-${prefix}`}
                        value={latitude.degrees}
                        onChange={latitude.setDegrees}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-min-${prefix}`}
                        value={latitude.minutes}
                        onChange={latitude.setMinutes}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lat-dir-${prefix}`}
                        value={latitude.direction}
                        onChange={latitude.setDirection}
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
                        value={longitude.degrees}
                        onChange={longitude.setDegrees}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={longitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-min-${prefix}`}
                        value={longitude.minutes}
                        onChange={longitude.setMinutes}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lon-dir-${prefix}`}
                        value={longitude.direction}
                        onChange={longitude.setDirection}
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
    const { latitude, longitude } = useCoordinateInputs(prefix, 'dms');

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor={`lat-deg-dms-${prefix}`}>Широта (градусы° минуты' секунды'')</Label>
                <div className="flex flex-wrap items-start gap-2">
                    <CoordinateInput
                        id={`lat-deg-dms-${prefix}`}
                        value={latitude.degrees}
                        onChange={latitude.setDegrees}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-min-dms-${prefix}`}
                        value={latitude.minutes}
                        onChange={latitude.setMinutes}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lat-sec-dms-${prefix}`}
                        value={latitude.seconds}
                        onChange={latitude.setSeconds}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lat-dir-dms-${prefix}`}
                        value={latitude.direction}
                        onChange={latitude.setDirection}
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
                        value={longitude.degrees}
                        onChange={longitude.setDegrees}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={longitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-min-dms-${prefix}`}
                        value={longitude.minutes}
                        onChange={longitude.setMinutes}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id={`lon-sec-dms-${prefix}`}
                        value={longitude.seconds}
                        onChange={longitude.setSeconds}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id={`lon-dir-dms-${prefix}`}
                        value={longitude.direction}
                        onChange={longitude.setDirection}
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
