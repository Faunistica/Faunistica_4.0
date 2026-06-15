import { TrendingUp, Award, MapPin, BookOpen } from 'lucide-react';
import type { UserStatisticsResponse, MyRankResponse } from '../../../types/api.dto.ts';

interface StatisticsProps {
    userStats?: UserStatisticsResponse | null;
    myRank?: MyRankResponse | null;
    isLoading?: boolean;
}

export function Statistics({ userStats, myRank, isLoading }: StatisticsProps) {
    const stats = [
        {
            icon: MapPin,
            label: 'Находок внесено',
            value: userStats?.records_entered ?? '—',
            color: '#2bb3d9',
        },
        {
            icon: BookOpen,
            label: 'Публикаций обработано',
            value: userStats?.publications_processed ?? '—',
            color: '#4ade80',
        },
        {
            icon: TrendingUp,
            label: 'Место в рейтинге',
            value: myRank ? `#${myRank.rank}` : '—',
            color: '#f59e0b',
        },
        {
            icon: Award,
            label: 'Записей в рейтинге',
            value: myRank?.record_count ?? '—',
            color: '#8b5cf6',
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="text-[#1a2332] mb-6">Статистика</h3>
            {isLoading ? (
                <div className="grid gap-6 grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center text-center p-4 rounded-lg animate-pulse">
                            <div className="w-13 h-13 rounded-lg mb-3 bg-gray-200" />
                            <div className="h-8 w-16 bg-gray-200 rounded mb-1" />
                            <div className="h-4 w-24 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-2">
                    {stats.map((stat, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: `${stat.color}20` }}>
                                <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
                            </div>
                            <div className="text-3xl mb-1" style={{ color: stat.color, fontWeight: 600 }}>
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
