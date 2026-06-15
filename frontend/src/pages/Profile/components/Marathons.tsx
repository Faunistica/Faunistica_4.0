import type { MarathonOut } from '../../../types/api.dto.ts';
import { InfoTooltip } from '../components/InfoTooltip';

interface MarathonsProps {
    marathons: MarathonOut[];
    isLoading?: boolean;
}

const marathonsInfo = `Марафон – месячное соревнование для волонтёров проекта.

Как это работает:
• Победитель – пользователь с наибольшим количеством записей за месяц
• Все участники, внесшие хотя бы одну запись в течение месяца, получают значок «Участник марафона [месяц]»
• Победитель получает значок «Победитель марафона [месяц]»

Участвуйте в марафонах, чтобы получить уникальные значки и поддержать науку!`;

function formatDateRange(starts: string, ends: string): string {
    const fmt = (d: string) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    return `${fmt(starts)} — ${fmt(ends)}`;
}

function isActive(marathon: MarathonOut): boolean {
    const now = Date.now();
    return new Date(marathon.starts_at).getTime() <= now && now <= new Date(marathon.ends_at).getTime();
}

export function Marathons({ marathons, isLoading }: MarathonsProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[#1a2332] text-xl font-semibold">Марафоны</h2>
                <InfoTooltip content={marathonsInfo} />
            </div>
            {isLoading ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-gray-200" />
                                <div className="h-5 bg-gray-200 rounded w-32" />
                            </div>
                            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                        </div>
                    ))}
                </div>
            ) : marathons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Пока нет марафонов. Администратор добавит их позже.</p>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {marathons.map((marathon) => {
                        const active = isActive(marathon);
                        return (
                            <div key={marathon.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-3xl shrink-0">🏃</span>
                                        <h3 className="font-semibold text-[#1a2332] text-lg truncate">{marathon.name}</h3>
                                    </div>
                                    {active && (
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                                            Активен
                                        </span>
                                    )}
                                </div>
                                {marathon.description && (
                                    <p className="text-sm text-gray-500 mb-2">{marathon.description}</p>
                                )}
                                <p className="text-xs text-gray-400">{formatDateRange(marathon.starts_at, marathon.ends_at)}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
