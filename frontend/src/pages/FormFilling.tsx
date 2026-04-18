import { type FC, useState } from "react";
import { useOutletContext } from "react-router";
import ArticleSourceCard from "@/components/forms/ArticleSourceCard";
import QuantitiesCard from "@/components/forms/QuantitiesCard";
import TaxonomyCard from "@/components/forms/TaxonomyCard";
import CollectionEventCard from "@/components/forms/CollectionEventCard";
import GeographyCard from "@/components/forms/GeographyCard";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import type { InsertRecordsRequest } from "@/types/api.dto";

interface OutletContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const FormFilling: FC = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext<OutletContextType>();

    const [samples, setSamples] = useState<Partial<InsertRecordsRequest>[]>([{}]);
    const [activeSampleIndex, setActiveSampleIndex] = useState(0);

    const activeSample = samples[activeSampleIndex] || {};

    const updateSample = (updates: Partial<InsertRecordsRequest>) => {
        setSamples(prev => {
            const newSamples = [...prev];
            newSamples[activeSampleIndex] = { ...newSamples[activeSampleIndex], ...updates };
            return newSamples;
        });
    };

    const addSample = () => {
        setSamples(prev => [...prev, {}]);
        setActiveSampleIndex(samples.length); // Next index
    };

    const removeSample = (index: number) => {
        setSamples(prev => {
            const newSamples = prev.filter((_, i) => i !== index);
            if (newSamples.length === 0) return [{}];
            return newSamples;
        });

        setActiveSampleIndex(prev => {
            if (samples.length - 1 === 0) return 0;
            if (prev >= index && prev > 0) return prev - 1;
            return prev;
        });
    };

    return (
        <>
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                samples={samples}
                activeSampleIndex={activeSampleIndex}
                setActiveSampleIndex={setActiveSampleIndex}
                addSample={addSample}
                removeSample={removeSample}
            />
            <main className="flex-1 flex flex-col w-full min-h-0">
                <div className="flex-1 w-full p-4 md:p-8 overflow-y-auto pb-32">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <ArticleSourceCard data={activeSample} updateData={updateSample} />
                        <GeographyCard data={activeSample} updateData={updateSample} />
                        <QuantitiesCard data={activeSample} updateData={updateSample} />
                        <TaxonomyCard data={activeSample} updateData={updateSample} />
                        <CollectionEventCard data={activeSample} updateData={updateSample} />
                    </div>
                </div>
                <Footer />
            </main>
        </>
    );
};

export default FormFilling;