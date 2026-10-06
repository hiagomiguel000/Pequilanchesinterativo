// Recebe os avisos de pedido novo e mostra a notificação no celular do dono, mesmo com o painel fechado.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Novo pedido', {
    body: d.corpo || 'Abra o painel para ver o pedido.',
    tag: d.tag || 'pedido',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 120, 300, 120, 600],
    icon: 'icone-192.png',
    data: { url: d.url || 'painel.html' }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var alvo = new URL((e.notification.data && e.notification.data.url) || 'painel.html', self.registration.scope);
  if (alvo.origin !== self.location.origin) alvo = new URL('painel.html', self.registration.scope);
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (janelas) {
    for (var i = 0; i < janelas.length; i++) {
      if (janelas[i].url.indexOf('painel.html') > -1 && 'focus' in janelas[i]) return janelas[i].focus();
    }
    return self.clients.openWindow(alvo.href);
  }));
});
