import { type FC } from 'react';
import { useRecordFormContext } from '@/contexts/RecordFormProvider';
import ArticleSourceCard from '@/components/form/ArticleSourceCard';
import GeographyCard from '@/components/form/GeographyCard';
import CollectionEventCard from '@/components/form/CollectionEventCard';
import TaxonomyCard from '@/components/form/TaxonomyCard';
import QuantitiesCard from '@/components/form/QuantitiesCard';
import ServerErrorDisplay from '@/components/form/ServerErrorDisplay';
import Footer from '@/components/form/FormFooter';
import LoadingScreen from '@/components/LoadingScreen';

const RecordFormContent: FC = () => {
    const { state, publ_id } = useRecordFormContext();
    const { activeRecordId, status, isInitialLoading } = state;

    if (isInitialLoading || !activeRecordId) {
        return <LoadingScreen />;
    }

    if (status.phase === 'syncing') {
        return <LoadingScreen />;
    }

    return (
        <div className="w-full flex-1 p-4 pb-20 md:p-8 md:pb-22">
            <div className="mx-auto max-w-6xl space-y-6">
                <ArticleSourceCard publ_id={publ_id} />
                <GeographyCard publ_id={publ_id} activeRecordId={activeRecordId} />
                <CollectionEventCard publ_id={publ_id} activeRecordId={activeRecordId} />
                <TaxonomyCard />
                <QuantitiesCard />
                <ServerErrorDisplay />
            </div>
            <Footer />
        </div>
    );
};

export default RecordFormContent;
