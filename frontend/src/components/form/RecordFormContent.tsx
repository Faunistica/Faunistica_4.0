import { type FC } from 'react';
import { useRecordForm } from '@/contexts/useRecordForm';
import ArticleSourceCard from '@/components/form/parts/ArticleSourceCard';
import GeographyCard from '@/components/form/parts/GeographyCard';
import CollectionEventCard from '@/components/form/parts/CollectionEventCard';
import TaxonomyCard from '@/components/form/parts/TaxonomyCard';
import QuantitiesCard from '@/components/form/parts/QuantitiesCard';
import ServerErrorDisplay from '@/components/form/ServerErrorDisplay';
import Footer from '@/components/form/parts/FormFooter';
import LoadingScreen from '@/components/LoadingScreen';

const RecordFormContent: FC = () => {
    const {
        state: { activeRecordId },
        publ_id,
    } = useRecordForm();

    if (!activeRecordId) {
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
