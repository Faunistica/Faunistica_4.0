import type { BadgeOut } from '../../../types/api.dto.ts';
import { InfoTooltip } from '../components/InfoTooltip';

const BADGE_TYPE_ICONS: Record<string, string> = {
    marathon_participant: '🏃',
    marathon_winner: '🏆',
    first_record: '🔍',
    records_50: '📦',
    records_100: '🌟',
    streak_30: '⚡',
    top10: '🥇',
};

interface BadgesProps {
    badges: BadgeOut[];
    isLoading?: boolean;
}

const badgesInfo = `Значки – это награды за достижения в проекте Faunistica.

Значки выдаются за:
• Экспертизу в определённых областях
• Качество и количество внесённых находок
• Активность и вклад в развитие проекта
• Участие и победы в марафонах

Получайте значки, выполняя различные задания и достигая новых целей!`;

export function Badges({ badges, isLoading }: BadgesProps) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[#1a2332] text-xl font-semibold">Значки достижений</h2>
                <InfoTooltip content={badgesInfo} />
            </div>
            {isLoading ? (
                <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center animate-pulse">
                            <div className="w-20 h-20 mx-auto rounded-xl bg-gray-200 mb-3" />
                            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-1" />
                            <div className="h-3 bg-gray-100 rounded w-full mx-auto" />
                        </div>
                    ))}
                </div>
            ) : badges.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Пока нет значков. Выполняйте задания, чтобы получить их!</p>
            ) : (
                <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all text-center"
                        >
                            <div className="w-20 h-20 mx-auto flex items-center justify-center">
                                <span className="text-4xl">
                                    {BADGE_TYPE_ICONS[badge.badge_type] ?? '🎖️'}
                                </span>
                            </div>
                            <div className="font-semibold text-[#1a2332] mt-3 text-sm">{badge.name}</div>
                            {badge.description && (
                                <div className="text-xs text-gray-400 mt-1 line-clamp-2">{badge.description}</div>
                            )}
                            <div className="mt-3">
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                    Получен
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
