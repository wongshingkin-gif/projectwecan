// 📦 在這裡設定 Cache 版本號，每次修改 index.html 後，請將此版本號 +1 (例如 v2 -> v3)
// 只要這個版本號改變，Service Worker 就會重新下載並清理舊快取
const CACHE_NAME = 'pos-system-v3';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// ⭐ Service Worker 安裝事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 命令新的 Service Worker 在安裝後立刻「接管」網頁，不用等待舊版分頁關閉
        return self.skipWaiting();
      })
  );
});

// ⭐ Service Worker 激活事件
self.addEventListener('activate', event => {
  // 清理舊版本的 Cache，確保只保留最新版
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('pos-system-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // 告訴前台網頁，新的 Service Worker 已經準備好了
      return self.clients.claim();
    })
  );
});

// ⭐ 攔截網路請求 (Stale-while-revalidate 策略：先顯試快取，同時更新快取)
self.addEventListener('fetch', event => {
  // 不要快取 Google Apps Script API 請求
  if (event.request.url.includes('script.google.com')) {
    return fetch(event.request); 
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果有快取，回傳快取
        if (response) {
          // 同時發送請求更新快取 (為下一次開啟做準備)
          fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          });
          return response;
        }
        // 沒有快取，直接去網路請求
        return fetch(event.request);
      })
  );
});

