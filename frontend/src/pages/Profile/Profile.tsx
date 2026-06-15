import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard.tsx';
import Footer from '../Landing/components/Footer';
import { useAppSelector } from '../../store/store.ts';
import {
    useGetMyBadgesQuery,
    useGetLeaderboardQuery,
    useGetMyRankQuery,
    useGetMarathonsQuery,
    useGetMyMapRecordsQuery,
    useGetUserStatsQuery,
} from '../../api/profileAPI.ts';

export interface Badge {
  id: string
  name: string
  description?: string
  icon: string
  imageUrl?: string
  earned: boolean
  condition?: string | null
  conditionValue?: number | null
}

export interface Marathon {
  id: string
  name: string
  rule: string
  icon?: string
  imageUrl?: string
  current: number
  goal: number
}

export default function Profile() {
    const userId = useAppSelector((state) => state.user.user_id);
    const [activeTab, setActiveTab] = useState('dashboard');

    const { data: badges = [], isLoading: badgesLoading } = useGetMyBadgesQuery();
    const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboardQuery({ period: 'all_time', limit: 10 });
    const { data: myRank, isLoading: rankLoading } = useGetMyRankQuery({ period: 'all_time' });
    const { data: marathons = [], isLoading: marathonsLoading } = useGetMarathonsQuery();
    const { data: mapRecords = [], isLoading: mapLoading } = useGetMyMapRecordsQuery();
    const { data: userStats, isLoading: statsLoading } = useGetUserStatsQuery(userId!, { skip: !userId });

    const isLoading = badgesLoading || leaderboardLoading || rankLoading || marathonsLoading || mapLoading || statsLoading;

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
            <div className="flex flex-1">
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="flex-1">
                    <Dashboard
                        activeTab={activeTab}
                        badges={badges}
                        marathons={marathons}
                        mapRecords={mapRecords}
                        leaderboard={leaderboard}
                        myRank={myRank}
                        userStats={userStats}
                        currentUserId={userId}
                        isLoading={isLoading}
                    />
                </main>
            </div>
            <Footer />
        </div>
    );
}
