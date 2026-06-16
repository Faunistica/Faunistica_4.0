import { type FC } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useRecordByIdQuery } from '@/api/recordAPI';
import { RecordStatusIndicator } from '@/components/form/sidebar/RecordStatusIndicator';
import { selectRecordSummary } from '@/lib/recordSelectors';
import { MapPin, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ─── Animations ─── */

const stagger = (i: number) => ({ delay: 0.05 * i });

const itemAnim = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
};

/* ─── Draft Record Item ─── */

const DraftRecordItem: FC<{ publ_id: number; recordId: string }> = ({ publ_id, recordId }) => {
    const { status, recordName, recordLocation } = useRecordByIdQuery(
        { record_id: recordId },
        { selectFromResult: selectRecordSummary },
    );

    return (
        <Link
            to={`/publication/${publ_id}/${recordId}`}
            className="flex items-center justify-between rounded-md border border-border px-4 py-3 transition-colors hover:bg-slate-50"
        >
            <div className="flex min-w-0 items-center gap-2">
                <RecordStatusIndicator status={status} />
                <span className="truncate text-sm font-bold text-slate-700">{recordName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="size-3" />
                <span className="truncate">{recordLocation}</span>
            </div>
        </Link>
    );
};

/* ─── Drafts Block ─── */

interface Props {
    publ_id: number;
    draftIds: string[];
}

const DraftsBlock: FC<Props> = ({ publ_id, draftIds }) => {
    const { t } = useTranslation();
    return (
    <>
        <motion.div variants={itemAnim} transition={stagger(0)} className="mb-8 text-center">
            <h1 className="text-2xl font-light tracking-wide sm:text-3xl">{t('submitPublication.completionUnavailable')}</h1>
            <p className="mt-1 text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
                {t('submitPublication.publicationNumber', { id: publ_id })}
            </p>
        </motion.div>

        <motion.div variants={itemAnim} transition={stagger(1)}>
            <div className="mb-3 flex items-start gap-2 text-slate-600">
                <AlertCircle className="size-5 shrink-0 pb-0.75 text-red-500" />
                <div className="flex flex-col">
                    <span className="font-semibold">
                        {draftIds.length === 1
                            ? t('submitPublication.draftCount', { count: draftIds.length })
                            : t('submitPublication.draftCount_plural', { count: draftIds.length })}
                    </span>
                    <span className="mb-4 text-sm text-muted-foreground">
                        {t('submitPublication.draftAction')}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {draftIds.map((recordId) => (
                    <DraftRecordItem key={recordId} publ_id={publ_id} recordId={recordId} />
                ))}
            </div>
        </motion.div>
    </>
    );
};

export default DraftsBlock;
