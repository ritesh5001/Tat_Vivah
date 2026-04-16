import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { dedupeTags } from './cache-tags.js';
function resolveRevalidateUrl() {
    if (env.FRONTEND_REVALIDATE_URL) {
        return env.FRONTEND_REVALIDATE_URL;
    }
    if (env.FRONTEND_BASE_URL) {
        return `${env.FRONTEND_BASE_URL.replace(/\/$/, '')}/api/internal/revalidate`;
    }
    return null;
}
export async function triggerFrontendRevalidation(tags) {
    const sanitizedTags = dedupeTags(tags);
    if (sanitizedTags.length === 0)
        return;
    const url = resolveRevalidateUrl();
    if (!url || !env.FRONTEND_REVALIDATE_SECRET) {
        return;
    }
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-revalidate-secret': env.FRONTEND_REVALIDATE_SECRET,
            },
            body: JSON.stringify({ tags: sanitizedTags }),
        });
        if (!response.ok) {
            logger.warn({ status: response.status, url, tags: sanitizedTags }, 'frontend_revalidate_request_failed');
        }
    }
    catch (error) {
        logger.warn({ error, url, tags: sanitizedTags }, 'frontend_revalidate_request_error');
    }
}
//# sourceMappingURL=revalidate.service.js.map