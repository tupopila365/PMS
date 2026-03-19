/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker - MSW 2.x
 * Minimal stub - app will use mock data via services when MSW fails to load
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
