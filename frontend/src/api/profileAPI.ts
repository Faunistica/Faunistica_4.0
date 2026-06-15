import { createApi } from '@reduxjs/toolkit/query/react';
import type {
    BadgeOut,
    LeaderboardResponse,
    MyRankResponse,
    MarathonOut,
    MapRecordOut,
    UserStatisticsResponse,
} from '../types/api.dto.ts';
import { baseQueryWithReauth } from './baseQuery.ts';

export const profileAPI = createApi({
    reducerPath: 'profileAPI',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['badges', 'leaderboard', 'marathons', 'map', 'userStats'],
    endpoints: (build) => ({
        getMyBadges: build.query<BadgeOut[], void>({
            query: () => '/badges/my',
            providesTags: ['badges'],
        }),
        getLeaderboard: build.query<LeaderboardResponse, { period?: string; limit?: number }>({
            query: ({ period = 'all_time', limit = 10 } = {}) =>
                `/leaderboard/?period=${period}&limit=${limit}`,
            providesTags: ['leaderboard'],
        }),
        getMyRank: build.query<MyRankResponse, { period?: string }>({
            query: ({ period = 'all_time' } = {}) => `/leaderboard/me?period=${period}`,
            providesTags: ['leaderboard'],
        }),
        getMarathons: build.query<MarathonOut[], void>({
            query: () => '/marathons/',
            providesTags: ['marathons'],
        }),
        getMyMapRecords: build.query<MapRecordOut[], void>({
            query: () => '/map/my',
            providesTags: ['map'],
        }),
        getUserStats: build.query<UserStatisticsResponse, number>({
            query: (userId) => `/statistics/users?user_id=${userId}`,
            providesTags: ['userStats'],
        }),
    }),
});

export const {
    useGetMyBadgesQuery,
    useGetLeaderboardQuery,
    useGetMyRankQuery,
    useGetMarathonsQuery,
    useGetMyMapRecordsQuery,
    useGetUserStatsQuery,
} = profileAPI;
