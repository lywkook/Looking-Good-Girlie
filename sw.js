/* 離線快取 Service Worker
   目標:有網路時開過一次後,之後就算伺服器掛掉(404)或完全沒網路,App 仍能開啟使用。
   策略:
   - 網頁(index.html/導覽):network-first,但只有「成功(200)」才用並更新快取;
     伺服器 404 或斷線時,改拿快取的 App(這正是 Netlify「Site not found」時的救命邏輯)。
   - 其他同源檔案(字體/圖示/manifest):cache-first(這些又大又不常變,存下來就好)。
   - 外部資源(Google Fonts 等):不攔截,交給瀏覽器,離線時 App 有內建後備字型。
*/
const CACHE = 'lgg-cache-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-192-2.png',
  './assets/icon-512-2.png',
  './assets/icon-180-2.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return; // 外部資源直接走網路

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.indexOf('text/html') >= 0;

  if (isHTML) {
    // network-first,但只認 200;否則(404/斷線)回快取的 App
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
            return res;
          }
          return caches.match('./index.html').then((r) => r || res);
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // 其他同源檔案:cache-first
  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
