/* Offline cache with a maximum age of one hour. */
const CACHE_NAME = "theophilus-portfolio-hourly-v6";
const MAX_CACHE_AGE_MS = 60 * 60 * 1000;
const CACHE_TIME_HEADER = "x-portfolio-cache-time";

function isFresh(response) {
    const savedAt = Number(response.headers.get(CACHE_TIME_HEADER));
    return Number.isFinite(savedAt) && Date.now() - savedAt < MAX_CACHE_AGE_MS;
}

function stampResponse(response) {
    return response.blob().then(function (body) {
        const headers = new Headers(response.headers);
        headers.set(CACHE_TIME_HEADER, String(Date.now()));
        return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });
    });
}

function saveResponse(cache, request, response) {
    if (!response || !response.ok) {
        return Promise.resolve();
    }

    return stampResponse(response.clone()).then(function (stampedResponse) {
        return cache.put(request, stampedResponse);
    });
}

self.addEventListener("install", function (event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames
                .filter(function (cacheName) {
                    return cacheName.indexOf("theophilus-portfolio-") === 0 && cacheName !== CACHE_NAME;
                })
                .map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "refresh-cache") {
        return;
    }

    /* Refresh every resource already used by this visitor without waiting for
       another page request. This runs once per hour while the page stays open. */
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.keys().then(function (requests) {
                return Promise.all(requests.map(function (request) {
                    return fetch(request, { cache: "reload" }).then(function (response) {
                        return saveResponse(cache, request, response);
                    }).catch(function () {
                        /* Keep the existing cached version when offline. */
                    });
                }));
            });
        })
    );
});

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(event.request).then(function (cachedResponse) {
                /* A cached file is used only for its first hour. */
                if (cachedResponse && isFresh(cachedResponse)) {
                    return cachedResponse;
                }

                return fetch(event.request).then(function (networkResponse) {
                    event.waitUntil(saveResponse(cache, event.request, networkResponse));
                    return networkResponse;
                }).catch(function () {
                    /* When offline, an older copy is still better than no page. */
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return new Response("You are offline.", {
                        status: 503,
                        statusText: "Service Unavailable",
                        headers: { "Content-Type": "text/plain; charset=utf-8" }
                    });
                });
            });
        })
    );
});
