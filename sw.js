const CACHE_NAME = 'pos-system-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 安裝 Service Worker 並快取基本檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  // ⭐ 重要：絕對不要快取對 Google Apps Script 的 API 請求，確保資料是即時的
  if (event.request.url.includes('script.google.com')) {
    return; 
  }
  
  // 其他靜態檔案優先從快取抓取，沒有才去網路下載
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});