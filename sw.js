const CACHE_NAME = "theophilus-portfolio-v2";
const APP_SHELL = [
    "./",
    "./index.html",
    "./about.html",
    "./projects.html",
    "./services.html",
    "./contact.html",
    "./help.html",
    "./newsletter.html",
    "./privacy.html",
    "./terms.html",
    "./404.html",
    "./thank-you.html",
    "./style.css",
    "./script.js",
    "./site.webmanifest",
    "./favicon.png",
    "./footer.png",
    "./hamburger.png",
    "./Theophilus.png",
    "./assets/favicon-64.png",
    "./assets/icon-180.png",
    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/icon-1024.png",
    "./assets/social-preview.svg",
    "./assets/hero-science.jpg",
    "./assets/header-science.jpg",
    "./assets/header-contact.jpg",
    "./assets/header-services.jpg",
    "./assets/newsletter-background.jpg",
    "./locales/de.js",
    "./locales/en.js",
    "./locales/es.js",
    "./locales/fr.js",
    "./locales/pt.js",
    "./locales/zh-CN.js",
    "./locales/zh-TW.js",
    "./fr/index.html",
    "./fr/about.html",
    "./fr/projects.html",
    "./fr/services.html",
    "./fr/contact.html",
    "./fr/help.html",
    "./fr/newsletter.html",
    "./fr/privacy.html",
    "./fr/terms.html",
    "./de/index.html",
    "./de/about.html",
    "./de/projects.html",
    "./de/services.html",
    "./de/contact.html",
    "./de/help.html",
    "./de/newsletter.html",
    "./de/privacy.html",
    "./de/terms.html",
    "./es/index.html",
    "./es/about.html",
    "./es/projects.html",
    "./es/services.html",
    "./es/contact.html",
    "./es/help.html",
    "./es/newsletter.html",
    "./es/privacy.html",
    "./es/terms.html",
    "./pt/index.html",
    "./pt/about.html",
    "./pt/projects.html",
    "./pt/services.html",
    "./pt/contact.html",
    "./pt/help.html",
    "./pt/newsletter.html",
    "./pt/privacy.html",
    "./pt/terms.html",
    "./zh-CN/index.html",
    "./zh-CN/about.html",
    "./zh-CN/projects.html",
    "./zh-CN/services.html",
    "./zh-CN/contact.html",
    "./zh-CN/help.html",
    "./zh-CN/newsletter.html",
    "./zh-CN/privacy.html",
    "./zh-CN/terms.html",
    "./zh-TW/index.html",
    "./zh-TW/about.html",
    "./zh-TW/projects.html",
    "./zh-TW/services.html",
    "./zh-TW/contact.html",
    "./zh-TW/help.html",
    "./zh-TW/newsletter.html",
    "./zh-TW/privacy.html",
    "./zh-TW/terms.html",
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(APP_SHELL);
            })
            .then(function () {
                return self.skipWaiting();
            })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (cacheName) {
                        return cacheName !== CACHE_NAME;
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

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") {
        return;
    }

    var requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(function (response) {
                    var copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, copy);
                    });
                    return response;
                })
                .catch(function () {
                    return caches.match(event.request).then(function (cachedResponse) {
                        return cachedResponse || caches.match("./404.html");
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(function (response) {
                if (response.ok) {
                    var copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, copy);
                    });
                }
                return response;
            });
        })
    );
});
