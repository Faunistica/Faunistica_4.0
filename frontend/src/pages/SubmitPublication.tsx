import { type FC, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
    useGetPublicationByIdQuery,
    useGetSubmitStatusQuery,
    useSubmitPublicationMutation,
} from '@/api/publAPI';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';

const SubmitPublication: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const publ_id = Number(id);

    const { data: pub, isLoading: pubLoading } = useGetPublicationByIdQuery(publ_id);
    const { data: status, isLoading: statusLoading } = useGetSubmitStatusQuery(publ_id);
    const [submit, { isLoading: submitting }] = useSubmitPublicationMutation();

    const [processingLevel, setProcessingLevel] = useState('');
    const [uralsScope, setUralsScope] = useState('');
    const [materialStatus, setMaterialStatus] = useState('');
    const [comment, setComment] = useState('');

    const draftIds = status?.draft_record_ids ?? [];
    const hasDrafts = draftIds.length > 0;

    const handleSubmit = async () => {
        if (!processingLevel) return;

        const result = await submit({
            publ_id,
            data: {
                processing_level: processingLevel as 'full' | 'ural' | 'part' | 'skip',
                urals_scope: (uralsScope as 'yes' | 'no') || null,
                material_status: (materialStatus as 'yes' | 'no') || null,
                comment: comment || null,
            },
        });

        if (!result.error) {
            toast.success('Публикация отмечена как обработанная');
            navigate('/dashboard', { replace: true });
        }
    };

    if (pubLoading || statusLoading) return <LoadingScreen />;

    return (
        <div className="mx-auto max-w-2xl py-8">
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-1 hover:text-slate-700"
                        >
                            <ArrowLeft className="size-4" />
                            На дашборд
                        </Link>
                        <span>/</span>
                        <span>Публикация #{publ_id}</span>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Завершение обработки
                    </CardTitle>
                    {pub && (
                        <p className="text-sm text-slate-600">
                            {pub.author ? `${pub.author}, ` : ''}
                            {pub.year ?? ''} — {pub.name || 'Без названия'}
                        </p>
                    )}
                </CardHeader>

                {hasDrafts ? (
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-center gap-2 text-amber-800">
                                <AlertCircle className="size-5 shrink-0" />
                                <span className="font-semibold">
                                    Завершение недоступно
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-amber-700">
                                Есть {draftIds.length}{' '}
                                {draftIds.length === 1
                                    ? 'черновая запись'
                                    : 'черновых записей'}
                                , которые нужно отправить или удалить.
                            </p>
                            <ul className="mt-3 space-y-1">
                                {draftIds.map((recordId) => (
                                    <li key={recordId}>
                                        <Link
                                            to={`/publication/${publ_id}/${recordId}`}
                                            className="text-sm font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900"
                                        >
                                            Запись {recordId.slice(0, 8)}…
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="processing-level" className="font-semibold">
                                Уровень обработки
                            </Label>
                            <Select
                                value={processingLevel}
                                onValueChange={setProcessingLevel}
                            >
                                <SelectTrigger id="processing-level">
                                    <SelectValue placeholder="Выберите уровень" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="full">Полная</SelectItem>
                                    <SelectItem value="ural">Урал</SelectItem>
                                    <SelectItem value="part">Частичная</SelectItem>
                                    <SelectItem value="skip">Пропуск</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Были ли находки за пределами Урала?
                            </Label>
                            <RadioGroup
                                value={uralsScope}
                                onValueChange={setUralsScope}
                                className="flex flex-col space-y-1"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yes" id="urals-yes" />
                                    <Label htmlFor="urals-yes" className="cursor-pointer font-normal">
                                        Да
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" id="urals-no" />
                                    <Label htmlFor="urals-no" className="cursor-pointer font-normal">
                                        Нет
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Были ли указания видов без материала?
                            </Label>
                            <RadioGroup
                                value={materialStatus}
                                onValueChange={setMaterialStatus}
                                className="flex flex-col space-y-1"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yes" id="mat-yes" />
                                    <Label htmlFor="mat-yes" className="cursor-pointer font-normal">
                                        Да
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" id="mat-no" />
                                    <Label htmlFor="mat-no" className="cursor-pointer font-normal">
                                        Нет
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comment" className="font-semibold">
                                Комментарий
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Любые замечания по публикации (опционально)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-24 resize-y"
                            />
                        </div>
                    </CardContent>
                )}

                <CardFooter className="flex items-center justify-between border-t border-slate-100 p-6">
                    <Button variant="outline" asChild>
                        <Link to="/dashboard">Отмена</Link>
                    </Button>
                    {!hasDrafts && (
                        <Button
                            onClick={handleSubmit}
                            disabled={!processingLevel || submitting}
                            className="bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Отправка...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 size-4" />
                                    Завершить
                                </>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default SubmitPublication;
