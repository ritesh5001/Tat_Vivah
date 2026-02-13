import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { NotificationJobPayload } from './types.js';

type NotificationQueueLike = Pick<Queue<NotificationJobPayload>, 'add' | 'close'>;

let redisConnection: Redis | null = null;
let queueInstance: Queue<NotificationJobPayload> | null = null;

function getOrCreateRedisConnection(): Redis | null {
    if (!env.REDIS_URL) {
        return null;
    }

    if (!redisConnection) {
        // BullMQ requires a dedicated Redis connection with maxRetriesPerRequest set to null
        redisConnection = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: null,
        });

        redisConnection.on('error', (err) => {
            console.error('Redis Queue Connection Error:', err);
        });
    }

    return redisConnection;
}

function createQueue(): NotificationQueueLike {
    const connection = getOrCreateRedisConnection();
    if (!connection) {
        console.warn('REDIS_URL is not set. Notifications queue is disabled.');
        return {
            add: async () => {
                // No-op when Redis is not configured
                return undefined as any;
            },
            close: async () => undefined,
        };
    }

    queueInstance = new Queue<NotificationJobPayload>('notification.queue', {
        connection,
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 5000, // 5s, 10s, 20s...
            },
            removeOnComplete: 1000, // Keep last 1000
            removeOnFail: 5000,    // Keep last 5000 failed
        },
    });

    return queueInstance;
}

export const notificationQueue: NotificationQueueLike = createQueue();

export function getQueueRedisConnection(): Redis | null {
    return getOrCreateRedisConnection();
}

export async function closeQueueResources(): Promise<void> {
    if (queueInstance) {
        await queueInstance.close();
        queueInstance = null;
    }

    if (redisConnection) {
        await redisConnection.quit();
        redisConnection = null;
    }
}
