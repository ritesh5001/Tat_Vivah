import { EventEmitter } from 'node:events';
import { Redis as IORedis } from 'ioredis';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export type DashboardEventType =
    | 'product.updated'
    | 'inventory.updated'
    | 'order.updated'
    | 'shipment.updated'
    | 'payment.updated'
    | 'catalog.updated';

export interface LiveEventAudience {
    allAuthenticated?: boolean;
    roles?: Role[];
    userIds?: string[];
}

export interface LiveDashboardEvent {
    type: DashboardEventType;
    tags: string[];
    entityId?: string;
    payload?: Record<string, unknown>;
    audience?: LiveEventAudience;
    occurredAt: string;
}

const emitter = new EventEmitter();
const EMIT_EVENT_NAME = 'dashboard-event';

let publisher: IORedis | null = null;
let subscriber: IORedis | null = null;
let redisBacked = false;

function emitLocal(event: LiveDashboardEvent): void {
    emitter.emit(EMIT_EVENT_NAME, event);
}

async function initializeRedisPubSub(): Promise<void> {
    if (!env.REDIS_URL || redisBacked) {
        return;
    }

    try {
        publisher = new IORedis(env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            connectTimeout: 2000,
        });

        subscriber = new IORedis(env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            connectTimeout: 2000,
        });

        await publisher.connect();
        await subscriber.connect();

        await subscriber.subscribe(env.LIVE_EVENTS_CHANNEL);
        subscriber.on('message', (channel: string, message: string) => {
            if (channel !== env.LIVE_EVENTS_CHANNEL) return;
            try {
                const parsed = JSON.parse(message) as LiveDashboardEvent;
                emitLocal(parsed);
            } catch (error) {
                logger.warn({ error }, 'live_event_parse_failed');
            }
        });

        redisBacked = true;
    } catch (error) {
        redisBacked = false;
        publisher = null;
        subscriber = null;
        logger.warn({ error }, 'live_event_redis_unavailable');
    }
}

void initializeRedisPubSub();

export function onLiveDashboardEvent(listener: (event: LiveDashboardEvent) => void): () => void {
    emitter.on(EMIT_EVENT_NAME, listener);
    return () => {
        emitter.off(EMIT_EVENT_NAME, listener);
    };
}

export async function publishLiveDashboardEvent(input: Omit<LiveDashboardEvent, 'occurredAt'>): Promise<void> {
    const event: LiveDashboardEvent = {
        ...input,
        occurredAt: new Date().toISOString(),
    };

    if (redisBacked && publisher) {
        try {
            await publisher.publish(env.LIVE_EVENTS_CHANNEL, JSON.stringify(event));
            return;
        } catch (error) {
            logger.warn({ error }, 'live_event_publish_failed_fallback_local');
        }
    }

    emitLocal(event);
}
