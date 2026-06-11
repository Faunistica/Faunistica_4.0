import { type FC } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { useGetPublicationByIdQuery, useGetDraftRecordIdsQuery } from '@/api/publAPI';
import { ArrowLeft, Flower2, AlertTriangle } from 'lucide-react';
import LoadingScreen from '@/components/LoadingScreen';
import { Card } from '@/components/ui/card';
import FormCard from '@/components/submit-publication/FormCard';
import DraftsBlock from '@/components/submit-publication/DraftsBlock';

const containerAnim = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
};

const SubmitPublication: FC = () => {
    const { id } = useParams<{ id: string }>();
    const publ_id = Number(id);

    const { data: pub, isLoading: pubLoading } = useGetPublicationByIdQuery(publ_id);
    const {
        data: status,
        isLoading: statusLoading,
        isError: statusError,
    } = useGetDraftRecordIdsQuery(publ_id);

    if (pubLoading || statusLoading) return <LoadingScreen />;

    if (statusError) {
        return (
            <div className="py-6">
                <div className="mx-auto max-w-2xl">
                    <Card className="p-6 sm:p-8">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <AlertTriangle className="size-8 text-red-500" />
                            <h2 className="text-lg font-semibold">Ошибка загрузки черновиков</h2>
                            <p className="text-sm text-muted-foreground">
                                Не удалось проверить наличие неотправленных записей. Попробуйте
                                обновить страницу.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    const draftIds = status?.draft_record_ids ?? [];
    const hasDrafts = draftIds.length > 0;
    const meta = pub
        ? [pub.author, pub.year?.toString(), pub.name].filter(Boolean).join(' — ')
        : '';

    return (
        <div className="py-6">
            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial="initial"
                    animate="animate"
                    variants={containerAnim}
                    transition={{ duration: 0.35 }}
                >
                    <Link
                        to="/dashboard"
                        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        На дашборд
                    </Link>

                    <motion.div variants={containerAnim} initial="initial" animate="animate">
                        <Card className="p-6 sm:p-8">
                            <div className="mb-3 flex items-center justify-center gap-3">
                                <div className="h-px w-12 bg-border" />
                                <Flower2 className="size-4 text-emerald-600" />
                                <div className="h-px w-12 bg-border" />
                            </div>

                            {hasDrafts ? (
                                <DraftsBlock publ_id={publ_id} draftIds={draftIds} />
                            ) : (
                                <FormCard publ_id={publ_id} meta={meta} />
                            )}
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default SubmitPublication;
