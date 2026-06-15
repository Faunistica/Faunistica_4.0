import { Statistics } from './Statistics';
import { Rating } from './Rating';
import { Badges } from './Badges';
import { Marathons } from './Marathons';
import { Map } from './Map';
import type { BadgeOut, LeaderboardResponse, MapRecordOut, MarathonOut, MyRankResponse, UserStatisticsResponse } from '../../../types/api.dto.ts';

interface DashboardProps {
    activeTab: string;
    badges: BadgeOut[];
    marathons: MarathonOut[];
    mapRecords: MapRecordOut[];
    leaderboard?: LeaderboardResponse | null;
    myRank?: MyRankResponse | null;
    userStats?: UserStatisticsResponse | null;
    currentUserId?: number | null;
    isLoading?: boolean;
}

export function Dashboard({ activeTab, badges, marathons, mapRecords, leaderboard, myRank, userStats, currentUserId, isLoading }: DashboardProps) {
    const userName = userStats?.name ?? 'Профиль';

    if (activeTab === 'dashboard') {
        return (
            <div className="p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-[#1a2332] text-2xl font-semibold mb-2">Добро пожаловать</h1>
                    <p className="text-gray-600">{userName}</p>
                </div>
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <Statistics userStats={userStats} myRank={myRank} isLoading={isLoading} />
                    </div>
                    <div className="lg:col-span-5">
                        <Rating leaderboard={leaderboard} myRank={myRank} currentUserId={currentUserId} isLoading={isLoading} />
                    </div>
                    <div className="lg:col-span-12">
                        <Badges badges={badges} isLoading={isLoading} />
                    </div>
                    <div className="lg:col-span-12">
                        <Map records={mapRecords} isLoading={isLoading} />
                    </div>
                    <div className="lg:col-span-12">
                        <Marathons marathons={marathons} isLoading={isLoading} />
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'badges') {
        return (
            <div className="p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-[#1a2332] text-2xl font-semibold mb-2">Значки достижений</h1>
                    <p className="text-gray-600">{userName}</p>
                </div>
                <Badges badges={badges} isLoading={isLoading} />
            </div>
        );
    }

    if (activeTab === 'marathons') {
        return (
            <div className="p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-[#1a2332] text-2xl font-semibold mb-2">Марафоны</h1>
                    <p className="text-gray-600">{userName}</p>
                </div>
                <Marathons marathons={marathons} isLoading={isLoading} />
            </div>
        );
    }

    if (activeTab === 'map') {
        return (
            <div className="p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-[#1a2332] text-2xl font-semibold mb-2">Карта находок</h1>
                    <p className="text-gray-600">{userName}</p>
                </div>
                <Map records={mapRecords} isLoading={isLoading} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div className="mb-6">
                <h1 className="text-[#1a2332] text-2xl font-semibold mb-2">Настройки</h1>
                <p className="text-gray-600">{userName}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-500">Раздел в разработке</p>
            </div>
        </div>
    );
}
