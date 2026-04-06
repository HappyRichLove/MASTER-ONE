const CACHE_NAME = 'master-one-v4';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(resp => {
                const clone = resp.clone();
                caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                return resp;
            })
            .catch(() => caches.match(event.request))
    );
});

self.addEventListener('push', event => {
    let data = {};
    try { 
        data = event.data.json(); 
    } catch (e) { 
        data = { title: 'MASTER ONE', body: event.data ? event.data.text() : 'Новое сообщение' }; 
    }

    const title = data.title || 'MASTER ONE';
    const body = data.body || 'Новый контент!';
    const url = data.url || './';

    // Сохраняем в историю через широковещательное сообщение всем вкладкам
    const pushData = {
        title,
        body,
        url,
        time: new Date().toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        type: 'PUSH_RECEIVED'
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, {
                body,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'post-' + Date.now(),
                data: { url },
                actions: [
                    { action: 'open', title: 'Открыть' },
                    { action: 'close', title: 'Позже' }
                ]
            }),
            // Рассылаем данные всем открытым окнам, чтобы они обновили историю в localStorage
            self.clients.matchAll({ type: 'window' }).then(clients => {
                clients.forEach(client => client.postMessage(pushData));
            })
        ])
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'close') return;
    const url = event.notification.data?.url || './';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(list => {
            for (const c of list) {
                if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
            }
            return clients.openWindow(url && url !== './' ? url : './');
        })
    );
});
