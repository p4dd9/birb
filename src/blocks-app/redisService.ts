import {Devvit} from '@devvit/public-api';
import type {Stats} from '../shared/types';

export type RedisService = {
    getStats: () => Promise<Stats>;
    saveStats: (stats: Stats) => Promise<void>;
}

export function createRedisService(context: Devvit.Context): RedisService {
    const { redis, postId, userId } = context;
    return {
        getStats: async () => {
            const retrievedStats = await redis.get(`stats_${postId}_${userId}`);
            console.log('Retrieved stats', retrievedStats, userId, postId);
            return retrievedStats ? JSON.parse(retrievedStats) : null;
        },
        saveStats: async (stats) => {
            await redis.set(`stats_${postId}_${userId}`, JSON.stringify(stats));
            console.log('Saved stats', stats, userId, postId);
        }
    };
}