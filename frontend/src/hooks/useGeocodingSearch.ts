import { useState, useRef, useCallback, useEffect } from 'react';

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 500;

function useGeocodingSearch() {
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (query.trim().length < MIN_QUERY_LENGTH) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru`,
            );
            const data: SearchResult[] = await res.json();
            setResults(data);
        } catch (error) {
            console.error('Geocoding error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const onSearch = useCallback(
        (text: string) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);

            if (text.trim().length < MIN_QUERY_LENGTH) {
                setResults([]);
                return;
            }

            debounceRef.current = setTimeout(() => {
                void performSearch(text);
            }, DEBOUNCE_MS);
        },
        [performSearch],
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return {
        suggestions: results.map((r) => r.display_name),
        resultMap: results,
        isSearching,
        onSearch,
    };
}

export default useGeocodingSearch;
