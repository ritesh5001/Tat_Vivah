import { EventEmitter } from 'node:events';
import { Redis as IORedis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
const emitter = new EventEmitter();
const EMIT_EVENT_NAME = 'dashboard-event';
let publisher = null;
let subscriber = null;
let redisBacked = false;
function emitLocal(event) {
    emitter.emit(EMIT_EVENT_NAME, event);
}
async function initializeRedisPubSub() {
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
        subscriber.on('message', (channel, message) => {
            if (channel !== env.LIVE_EVENTS_CHANNEL)
                return;
            try {
                const parsed = JSON.parse(message);
                emitLocal(parsed);
            }
            catch (error) {
                logger.warn({ error }, 'live_event_parse_failed');
            }
        });
        redisBacked = true;
    }
    catch (error) {
        redisBacked = false;
        publisher = null;
        subscriber = null;
        logger.warn({ error }, 'live_event_redis_unavailable');
    }
}
void initializeRedisPubSub();
export function onLiveDashboardEvent(listener) {
    emitter.on(EMIT_EVENT_NAME, listener);
    return () => {
        emitter.off(EMIT_EVENT_NAME, listener);
    };
}
export async function publishLiveDashboardEvent(input) {
    const event = {
        ...input,
        occurredAt: new Date().toISOString(),
    };
    if (redisBacked && publisher) {
        try {
            await publisher.publish(env.LIVE_EVENTS_CHANNEL, JSON.stringify(event));
            return;
        }
        catch (error) {
            logger.warn({ error }, 'live_event_publish_failed_fallback_local');
        }
    }
    emitLocal(event);
}
//# sourceMappingURL=live-events.js.map