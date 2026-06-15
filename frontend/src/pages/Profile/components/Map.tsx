import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import type { MapRecordOut } from '../../../types/api.dto.ts';

// Fix default marker icons broken by webpack/vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
    records: MapRecordOut[];
    isLoading?: boolean;
}

export function Map({ records, isLoading }: MapProps) {
    const withCoords = records.filter((r) => r.latitude != null && r.longitude != null);
    const lastRecord = records[0];

    const center: [number, number] = withCoords.length > 0
        ? [withCoords[0].latitude!, withCoords[0].longitude!]
        : [55.75, 37.62]; // Москва по умолчанию

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            <h3 className="text-[#1a2332] mb-6">Карта находок</h3>
            {isLoading ? (
                <div className="rounded-lg bg-gray-100 animate-pulse flex-1 min-h-75" />
            ) : withCoords.length === 0 ? (
                <div className="bg-linear-to-br from-[#2bb3d9]/10 to-[#8b5cf6]/10 rounded-lg flex items-center justify-center flex-1 min-h-75">
                    <div className="text-center text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-[#2bb3d9]" />
                        <p className="mb-1">Нет находок с координатами</p>
                        <p className="text-sm text-gray-400">Добавьте координаты к находкам</p>
                    </div>
                </div>
            ) : (
                <div className="rounded-lg overflow-hidden flex-1 min-h-75">
                    <MapContainer
                        center={center}
                        zoom={5}
                        style={{ height: '100%', width: '100%', minHeight: '300px' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {withCoords.map((record) => (
                            <Marker key={record.id} position={[record.latitude!, record.longitude!]}>
                                <Popup>
                                    <div className="text-sm">
                                        {record.genus && record.species
                                            ? <em>{record.genus} {record.species}</em>
                                            : record.genus
                                            ? <em>{record.genus}</em>
                                            : 'Находка'}
                                        <br />
                                        <span className="text-gray-500">
                                            {new Date(record.created_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-600">
                <span>Маркеров на карте: <strong className="text-[#1a2332]">{withCoords.length}</strong></span>
                {lastRecord && (
                    <span className="text-gray-400">
                        {new Date(lastRecord.created_at).toLocaleDateString('ru-RU')}
                    </span>
                )}
            </div>
        </div>
    );
}
