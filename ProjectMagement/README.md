# CBMP - Construction Business Management Platform

Multi-tenant construction business management platform with project lifecycle, workflow engine, geo-tagged media, and financial tracking.

## Project Structure

```
Project Management/
├── frontend/     # React + Vite + TypeScript + Ant Design
├── backend/      # Spring Boot + SQLite (migrate to SQL Server later)
└── docs/         # Design documentation
```

## Quick Start

### Frontend + backend (REST + CORS)

1. **JDK 17+** installed and `JAVA_HOME` set (the Maven Wrapper needs it). Start the API from `backend`:
   - **Windows (PowerShell):** `.\mvnw.cmd spring-boot:run`
   - **macOS / Linux:** `./mvnw spring-boot:run`  
   If `mvn` is not recognized, use the commands above; you do not need Maven installed globally. First run may download Apache Maven into your user folder. Listens on port **8081** (8080 is avoided because many machines run Apache or other tools there).
2. Leave `VITE_API_URL` unset in `frontend/.env` so the Vite dev server proxies `/api` to `http://localhost:8081` (no browser CORS in dev).
3. `cd frontend && npm install && npm run dev` → http://localhost:5173
4. Login: **admin@cbmp.com** / **password**

**Direct API URL (CORS):** To call the backend from the browser without the proxy, set `VITE_API_URL=http://localhost:8081/api` in `frontend/.env`. The backend allows origins `http://localhost:5173` and `http://127.0.0.1:5173` for `/api/**`.

## Features

- **Auth**: JWT, role-based access
- **Dashboard**: KPIs, completion %, budget overview
- **Projects**: List, detail, types (construction, roads, railway, buildings)
- **Tasks**: List view, Kanban board, status updates
- **Media**: Upload geo-tagged images, gallery, map view (Leaflet)
- **Finance**: Invoices, payments, outstanding balance
- **Reports**: Charts by project type
- **Admin**: Company, users, subscription

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Ant Design, React Router, TanStack Query, Leaflet, Recharts
- **Backend**: Spring Boot 3, SQLite (SQL Server later)
