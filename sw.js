// Service Worker for Tealize Website
// ✅ 只需改這一個數字就能讓所有客戶端強制更新快取
const CACHE_VERSION = 4;
const CACHE_NAME = `tealize-v${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/lag-afterword.html', 
  '/manifest.json',
  '/js/i18n.js',
  '/js/app.js',         
  
  // 新增所有拆分的 CSS
  '/css/variables.css',
  '/css/base.css',
  '/css/nav.css',
  '/css/controls.css',
  '/css/visual-mode.css',
  '/css/lag-section.css',
  '/css/code-mode.css',
  '/css/light-overrides.css',
  '/css/responsive.css',

  // 圖片
  '/img/avatar_white.jpg',
  '/img/avatar_black.jpg',
  '/img/Story_Command1.jpg',
  '/img/Story_Command2.jpg',
  '/img/Story_Command0_Station_Underground_City_Rules.jpg',
  '/img/Crossing_the_Soil.jpg',
  '/img/Friend_or_Fraud1.jpg',
  '/img/Friend_or_Fraud2.jpg',
  '/img/leonAndGod.jpg',
  '/img/littlelion.jpg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Don't fail if some resources can't be cached
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { cache: 'reload' });
        }).map(request => {
          return fetch(request).then(response => {
            return cache.put(request, response);
          }).catch(err => {
            console.log('Failed to cache:', request.url);
          });
        }));
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.log('Fetch failed:', error);
          // You could return a custom offline page here
        });
      })
  );
});