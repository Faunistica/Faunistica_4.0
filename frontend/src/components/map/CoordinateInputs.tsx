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
import { useTranslation } from 'react-i18next';
import { useCoordinateInputs } from '@/hooks/useCoordinateInputs';

interface Props {
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

export const DMInputGroup: FC<Props> = ({ disabled }) => {
    const { t } = useTranslation();
    const { latitude, longitude } = useCoordinateInputs('dm');

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="latitude-deg">{t('form.coordinates.latitudeDM')}</Label>
                <div className="flex items-start gap-2">
                    <CoordinateInput
                        id="latitude-deg"
                        {...latitude.degrees}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id="latitude-min"
                        {...latitude.minutes}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id="latitude-dir"
                        {...latitude.direction}
                        options={[
                            { value: 'N', label: t('form.coordinates.northFull') },
                            { value: 'S', label: t('form.coordinates.southFull') },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="longtitude-deg">{t('form.coordinates.longitudeDM')}</Label>
                <div className="flex items-start gap-2">
                    <CoordinateInput
                        id="longtitude-deg"
                        {...longitude.degrees}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={longitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id="longtitude-min"
                        {...longitude.minutes}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id="longtitude-dir"
                        {...longitude.direction}
                        options={[
                            { value: 'E', label: t('form.coordinates.eastFull') },
                            { value: 'W', label: t('form.coordinates.westFull') },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};

export const DMSInputGroup: FC<Props> = ({ disabled }) => {
    const { t } = useTranslation();
    const { latitude, longitude } = useCoordinateInputs('dms');

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="latitude-deg-dms">{t('form.coordinates.latitudeDMS')}</Label>
                <div className="flex flex-wrap items-start gap-2">
                    <CoordinateInput
                        id="latitude-deg-dms"
                        {...latitude.degrees}
                        min={0}
                        max={90}
                        placeholder="°"
                        error={latitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id="latitude-min-dms"
                        {...latitude.minutes}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id="latitude-sec-dms"
                        {...latitude.seconds}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id="latitude-dir-dms"
                        {...latitude.direction}
                        options={[
                            { value: 'N', label: t('form.coordinates.northFull') },
                            { value: 'S', label: t('form.coordinates.southFull') },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="longtitude-deg-dms">{t('form.coordinates.longitudeDMS')}</Label>
                <div className="flex flex-wrap items-start gap-2">
                    <CoordinateInput
                        id="longtitude-deg-dms"
                        {...longitude.degrees}
                        min={0}
                        max={180}
                        placeholder="°"
                        error={longitude.error}
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id="longtitude-min-dms"
                        {...longitude.minutes}
                        min={0}
                        max={59}
                        placeholder="'"
                        disabled={disabled}
                    />
                    <CoordinateInput
                        id="longtitude-sec-dms"
                        {...longitude.seconds}
                        min={0}
                        max={59.9999}
                        step={0.0001}
                        placeholder="''"
                        disabled={disabled}
                    />
                    <DirectionSelect
                        id="longtitude-dir-dms"
                        {...longitude.direction}
                        options={[
                            { value: 'E', label: t('form.coordinates.eastFull') },
                            { value: 'W', label: t('form.coordinates.westFull') },
                        ]}
                        disabled={disabled}
                    />
                </div>
            </div>
        </div>
    );
};
