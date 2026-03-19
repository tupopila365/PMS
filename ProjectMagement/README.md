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

### Frontend (runs with mock data by default)

1. Free disk space if needed, then:
2. `cd frontend && npm install`
3. `npm run dev`
4. Open http://localhost:5173
5. Login: **admin@cbmp.com** / **password**

### Backend (optional - for real API)

1. `cd backend && mvn spring-boot:run`
2. Set `VITE_API_URL=http://localhost:8080/api` in frontend `.env` to use real API

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
- **Mock mode**: Services use local mock data when `VITE_API_URL` is unset
