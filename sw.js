const CACHE_NAME = 'master-one-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});

// Push from server
self.addEventListener('push', event => {
    let data = {};
    try { data = event.data.json(); } catch (e) { data = { title: 'MASTER ONE', body: event.data ? event.data.text() : 'Новый контент!' }; }

    const options = {
        body: data.body || 'Новый контент!',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'post-' + Date.now(),
        data: { url: data.url || './' },
        actions: [
            { action: 'open', title: 'Открыть' },
            { action: 'close', title: 'Позже' }
        ]
    };

    event.waitUntil(self.registration.showNotification(data.title || 'MASTER ONE', options));
});

// Click on notification
self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'close') return;

    const url = event.notification.data?.url || './';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(list => {
            for (const c of list) {
                if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
            }
            if (url && url !== './') return clients.openWindow(url);
            return clients.openWindow('./');
        })
    );
});
