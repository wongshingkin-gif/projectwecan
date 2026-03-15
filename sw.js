// 📦 版本號更新為 v8，強制手機更新快取
const CACHE_NAME = 'pos-system-v8';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name.startsWith('pos-system-') && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 🚨 終極修正：對於發送資料(POST)或連線至 Google 的請求
  // 直接 return 讓瀏覽器自己處理，絕不重複發送！
  if (event.request.method === 'POST' || event.request.url.includes('script.google.com')) {
    return; 
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        // 背景靜默更新快取
        fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return response;
      }
      return fetch(event.request);
    })
  );
});

