/// <reference types="vite/client" />

declare module 'msw' {
  export const http: { get: any; post: any; put: any; delete: any }
  export const HttpResponse: { json: (data: unknown, init?: { status?: number }) => unknown }
}

declare module 'msw/browser' {
  export function setupWorker(...handlers: any[]): { start: (opts?: any) => Promise<void> }
}
