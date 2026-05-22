import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { cn } from '@/lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// 🔧 Фикс иконок Leaflet в React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon,
    shadowUrl: markerShadow,
});

// ✅ Хелпер: проверка валидности координат
const isValidCoordinate = (value: number | null | undefined): value is number => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

interface MapProps {
    latitude?: number | null;
    longitude?: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

// Компонент для обработки кликов по карте
const MapClickHandler = ({
    onLocationSelect,
}: {
    onLocationSelect: (lat: number, lng: number) => void;
}) => {
    useMapEvents({
        click(e) {
            onLocationSelect(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
        },
    });
    return null;
};

interface SearchResult {
    display_name: string;
    lat: string;
    lon: string;
    boundingbox: [string, string, string, string]; // [latMin, latMax, lonMin, lonMax]
}

export const GeographyMap = ({ latitude, longitude, onLocationSelect }: MapProps) => {
    const [map, setMap] = useState<L.Map | null>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const skipNextSearchRef = useRef(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const defaultCenter: [number, number] = [55.75, 37.61]; // Москва

    // ✅ Безопасный расчет центра карты
    const center: [number, number] =
        isValidCoordinate(latitude) && isValidCoordinate(longitude)
            ? [latitude, longitude]
            : defaultCenter;

    // 🔍 Функция выполнения поиска (вынесена для вызова по Enter)
    const performSearch = async (searchQuery: string) => {
        if (searchQuery.trim().length < 3) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery,
                )}&limit=5&accept-language=ru`,
            );
            const data: SearchResult[] = await res.json();
            setResults(data);
            setShowDropdown(data.length > 0);
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            setResults([]);
            setShowDropdown(false);
        } finally {
            setIsSearching(false);
        }
    };

    // 🔁 Debounce-поиск при вводе
    useEffect(() => {
        // 🔑 Если стоит флаг от handleSelect → сбрасываем его и выходим
        if (skipNextSearchRef.current) {
            skipNextSearchRef.current = false;
            return () => {};
        }

        if (query.trim().length < 3) {
            setResults([]);
            setShowDropdown(false);
            return () => {};
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            void performSearch(query);
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    // 🧹 Cleanup debounce при размонтировании
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // 🖱️ Закрытие выпадающего списка при клике вне
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(e.target as Node) &&
                !(e.target as HTMLElement).closest('.search-dropdown')
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 🔎 Логирование невалидных координат (для отладки)
    useEffect(() => {
        if (latitude !== undefined && !isValidCoordinate(latitude)) {
            console.warn('Invalid latitude received:', latitude);
        }
        if (longitude !== undefined && !isValidCoordinate(longitude)) {
            console.warn('Invalid longitude received:', longitude);
        }
    }, [latitude, longitude]);

    // ✅ Выбор результата из списка
    const handleSelect = (item: SearchResult) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        onLocationSelect(Number(lat.toFixed(6)), Number(lng.toFixed(6)));

        if (map && item.boundingbox) {
            const [latMin, latMax, lonMin, lonMax] = item.boundingbox.map(parseFloat);
            map.flyToBounds(L.latLngBounds([latMin, lonMin], [latMax, lonMax]), {
                padding: [50, 50],
                maxZoom: 16,
            });
        } else if (map) {
            map.flyTo([lat, lng], 14);
        }

        setQuery(item.display_name);
        setShowDropdown(false);
        setSelectedIndex(-1);
        skipNextSearchRef.current = true; // 🔑 Игнорируем следующий запуск useEffect
        inputRef.current?.blur();
    };

    // 1️⃣ Добавь стейт для отслеживания выбранного пункта (рядом с другими useState)
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    // 2️⃣ Сбрасывай индекс при обновлении результатов или открытии списка
    useEffect(() => {
        setSelectedIndex(-1);
    }, [results, showDropdown]);

    // 3️⃣ Замени текущий handleInputKeyDown на этот
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Если список закрыт → Enter запускает поиск
        if (!showDropdown || results.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
                void performSearch(query);
            }
            return;
        }

        // Навигация стрелками
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        }
        // Enter → выбор выделенного (или первого, если ничего не выделено)
        else if (e.key === 'Enter') {
            e.preventDefault();
            const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
            handleSelect(results[targetIndex]);
        }
        // Escape → закрытие
        else if (e.key === 'Escape') {
            setShowDropdown(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="relative">
            {/* 🔍 Поле поиска */}
            <div className="absolute top-3 left-3 z-[1000] w-72">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Введите адрес или место..."
                    className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {/* 🔄 Индикатор загрузки */}
                {isSearching && (
                    <div className="absolute top-2.5 right-3">
                        <span className="relative flex h-4 w-4">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-500"></span>
                        </span>
                    </div>
                )}

                {/* 📋 Выпадающий список результатов */}
                {showDropdown && results.length > 0 && (
                    <ul className="search-dropdown absolute top-full z-[1001] mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                        {results.map((item, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(index)} // Синхронизация мыши и клавиатуры
                                className={cn(
                                    'cursor-pointer border-b border-slate-100 px-4 py-2 text-sm transition-colors duration-150 last:border-b-0',
                                    index === selectedIndex
                                        ? 'bg-blue-500 font-medium text-white'
                                        : 'hover:bg-slate-100',
                                )}
                            >
                                {item.display_name}
                                {index === selectedIndex && (
                                    <span className="ml-2 text-xs opacity-70">↵</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 🗺️ Карта */}
            <div className="z-0 h-[350px] w-full overflow-hidden rounded-md border border-slate-200">
                <MapContainer
                    center={center}
                    zoom={10}
                    ref={setMap}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={onLocationSelect} />
                    {isValidCoordinate(latitude) && isValidCoordinate(longitude) && (
                        <Marker position={[latitude, longitude]} />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};
