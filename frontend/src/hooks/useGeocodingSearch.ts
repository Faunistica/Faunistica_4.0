import { useState, useCallback } from 'react';
import { useDebouncedRaceSafe } from './useDebouncedRaceSafe';

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string];
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 500;

function isSearchResultArray(value: unknown): value is SearchResult[] {
    return (
        Array.isArray(value) &&
        value.every((item) => typeof item === 'object' && item !== null && 'display_name' in item)
    );
}

function useGeocodingSearch() {
    const [results, setResults] = useState<SearchResult[]>([]);

    const { fn: debouncedFetch, isPending } = useDebouncedRaceSafe(
        async (query: string, signal: AbortSignal) => {
            // TODO: use backend's reverse geocode
            // https://operations.osmfoundation.org/policies/nominatim/
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ru`,
                { signal },
            );
            const data: unknown = await res.json();
            return isSearchResultArray(data) ? data : [];
        },
        setResults,
        DEBOUNCE_MS,
    );

    const onSearch = useCallback(
        (text: string) => {
            if (text.trim().length < MIN_QUERY_LENGTH) {
                setResults([]);
                return;
            }
            debouncedFetch(text);
        },
        [debouncedFetch],
    );

    return {
        suggestions: results.map((r) => r.display_name),
        resultMap: results,
        isSearching: isPending,
        onSearch,
    };
}

export default useGeocodingSearch;
