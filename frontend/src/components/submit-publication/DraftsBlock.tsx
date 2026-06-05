import { type FC } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useRecordByIdQuery } from '@/api/recordAPI';
import { RecordStatusIndicator } from '@/components/form/sidebar/RecordStatusIndicator';
import { selectRecordSummary } from '@/lib/recordSelectors';
import { MapPin, AlertCircle } from 'lucide-react';

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

const DraftsBlock: FC<Props> = ({ publ_id, draftIds }) => (
    <>
        <motion.div variants={itemAnim} transition={stagger(0)} className="mb-8 text-center">
            <h1 className="text-2xl font-light tracking-wide sm:text-3xl">Завершение недоступно</h1>
            <p className="mt-1 text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase">
                Публикация #{publ_id}
            </p>
        </motion.div>

        <motion.div variants={itemAnim} transition={stagger(1)}>
            <div className="mb-3 flex items-center justify-center gap-2 font-semibold text-amber-700">
                <AlertCircle className="size-5 shrink-0" />
                <span>
                    Есть {draftIds.length}{' '}
                    {draftIds.length === 1 ? 'черновая запись' : 'черновых записей'}
                </span>
            </div>
            <p className="mb-4 text-center text-sm text-muted-foreground">
                которые нужно отправить или удалить.
            </p>

            <div className="space-y-2">
                {draftIds.map((recordId) => (
                    <DraftRecordItem key={recordId} publ_id={publ_id} recordId={recordId} />
                ))}
            </div>
        </motion.div>
    </>
);

export default DraftsBlock;
