const CACHE_NAME = 'nostalgy-core-v3'; // Subimos versión para forzar actualización
const urlsToCache = [
  './',
  './index.html',
  './inicio.html',
  './admin.html',
  './manifest.webmanifest',
  './style/style.css',
  './scripts/pwa.js',
  './scripts/script.js',
  './scripts/productos.js',
  
  // RECURSOS LOCALES
  './recursos/fondo.webp',
  './recursos/fondo2.webp',
  './recursos/logoNC.webp',
  './recursos/cursor-pixel.webp',
  './recursos/mano-pixel.png',
  './recursos/fish.glb',
  './recursos/nosotros.png',
  './recursos/iconCar.png',
  
  // LIBRERÍAS EXTERNAS (CSS y JS)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css',
  'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.js',

  // FUENTES (Solo los CSS iniciales)
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap',
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;800&display=swap'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando archivos estáticos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activado. Limpiando versiones viejas...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. ESTRATEGIA PARA FUENTES DE GOOGLE (.woff2)
  // Si la url viene de fonts.gstatic.com, la guardamos dinámicamente
  if (url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        // Si ya tengo la fuente, la devuelvo
        if (response) return response;

        // Si no, la busco en internet y la guardo para siempre
        return fetch(event.request).then(newResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, newResponse.clone());
            return newResponse;
          });
        });
      })
    );
    return; // Terminamos aquí para las fuentes
  }

  // 2. ESTRATEGIA STANDARD (Cache First) para el resto
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Clonamos el request para poder usarlo dos veces (fetch y cache)
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(networkResponse => {
            // Validamos que la respuesta sea válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Aquí podrías retornar una imagen placeholder si falla la carga
            console.log('[SW] Modo Offline: Recurso no encontrado');
          });
      })
  );
});
