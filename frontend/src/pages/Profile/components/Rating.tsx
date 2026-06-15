import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardResponse, MyRankResponse } from '../../../types/api.dto.ts';

interface RatingProps {
    leaderboard?: LeaderboardResponse | null;
    myRank?: MyRankResponse | null;
    currentUserId?: number | null;
    isLoading?: boolean;
}

const TOP3_ICONS = [
    { icon: Trophy, color: '#fbbf24' },
    { icon: Medal, color: '#9ca3af' },
    { icon: Award, color: '#cd7f32' },
];

export function Rating({ leaderboard, myRank, currentUserId, isLoading }: RatingProps) {
    const entries = leaderboard?.entries ?? [];

    const userInTop = entries.some((e) => e.user_id === currentUserId);
    const showMyRow = myRank && currentUserId && !userInTop;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="text-[#1a2332] mb-6">Рейтинг волонтёров</h3>
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 animate-pulse">
                            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                            <div className="flex-1 h-4 bg-gray-200 rounded" />
                            <div className="w-12 h-4 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => {
                        const isMe = entry.user_id === currentUserId;
                        const top3 = TOP3_ICONS[entry.rank - 1];
                        return (
                            <div
                                key={entry.user_id}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                    isMe
                                        ? 'bg-[#2bb3d9]/10 border border-[#2bb3d9]'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${top3 ? 'bg-white shadow-sm' : 'bg-gray-200'}`}>
                                    {top3 ? (
                                        <top3.icon className="w-5 h-5" style={{ color: top3.color }} />
                                    ) : (
                                        <span className="text-sm text-gray-600">{entry.rank}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`truncate ${isMe ? 'text-[#2bb3d9]' : 'text-[#1a2332]'}`}>
                                        {isMe ? 'Вы' : (entry.name ?? `Пользователь ${entry.user_id}`)}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600 shrink-0">
                                    {entry.record_count.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}

                    {showMyRow && (
                        <>
                            <div className="text-center text-gray-400 text-xs py-1">• • •</div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#2bb3d9]/10 border border-[#2bb3d9]">
                                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 shrink-0">
                                    <span className="text-sm text-gray-600">{myRank.rank}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="truncate text-[#2bb3d9]">Вы</div>
                                </div>
                                <div className="text-sm text-gray-600 shrink-0">
                                    {myRank.record_count.toLocaleString()}
                                </div>
                            </div>
                        </>
                    )}

                    {entries.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Рейтинг пока пуст</p>
                    )}
                </div>
            )}
        </div>
    );
}
