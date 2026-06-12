import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import Autocomplete from '@/components/ui/autocomplete';
import useGeocodingSearch from '@/hooks/useGeocodingSearch';

const leafletIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const isValidCoordinate = (value: number | null | undefined): value is number => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

interface MapProps {
    latitude?: number | null;
    longitude?: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

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

export const GeographyMap = ({ latitude, longitude, onLocationSelect }: MapProps) => {
    const [map, setMap] = useState<L.Map | null>(null);
    const { suggestions, resultMap, isSearching, onSearch } = useGeocodingSearch();

    const defaultCenter: [number, number] = [58.006, 56.18];

    const center: [number, number] =
        isValidCoordinate(latitude) && isValidCoordinate(longitude)
            ? [latitude, longitude]
            : defaultCenter;

    const handleSelect = (displayName: string) => {
        const item = resultMap.find((r) => r.display_name === displayName);
        if (!item) return;

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
    };

    useEffect(() => {
        if (latitude !== undefined && !isValidCoordinate(latitude)) {
            console.warn('Invalid latitude received:', latitude);
        }
        if (longitude !== undefined && !isValidCoordinate(longitude)) {
            console.warn('Invalid longitude received:', longitude);
        }
    }, [latitude, longitude]);

    return (
        <div className="relative">
            <div className="absolute top-3 left-3 z-100 w-72">
                <Autocomplete
                    className="border border-input bg-background text-secondary-foreground shadow-sm"
                    id="geo-search"
                    placeholder="Введите адрес или место..."
                    suggestions={suggestions}
                    isLoading={isSearching}
                    onSearch={onSearch}
                    onSelect={handleSelect}
                    blurOnSelect
                />
            </div>

            <div className="z-0 h-90 w-full overflow-hidden rounded-md border border-slate-200">
                <MapContainer
                    center={center}
                    zoom={10}
                    ref={setMap}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    zoomControl={false}
                    // TODO: find a better fix
                    attributionControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={onLocationSelect} />
                    {isValidCoordinate(latitude) && isValidCoordinate(longitude) && (
                        <Marker position={[latitude, longitude]} icon={leafletIcon} />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};
