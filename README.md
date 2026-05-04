# Cinema Agency Dashboard — Next.js

Full internal agency management dashboard for Cinema, a landing page agency. No backend, no auth — all data persists in `localStorage`.

## Quick Start

```bash
npm install
npm run dev
# Open http://localhost:3000
```

For the AI Assistant, add your Anthropic API key:
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
```

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data persistence | `localStorage` (no backend) |
| Charts | Custom SVG (no external lib) |
| AI | Anthropic Claude (server-side API route) |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (imports globals.css)
│   ├── layout-shell.tsx    # Dashboard shell: sidebar + header + toast context
│   ├── page.tsx            # / → Dashboard
│   ├── clients/page.tsx    # /clients
│   ├── projects/page.tsx   # /projects
│   ├── invoices/page.tsx   # /invoices
│   ├── approvals/page.tsx  # /approvals
│   ├── analytics/page.tsx  # /analytics
│   ├── ai/page.tsx         # /ai
│   ├── activity/page.tsx   # /activity
│   ├── api/ai/route.ts     # POST /api/ai — Anthropic proxy
│   └── globals.css         # Tailwind + dark base styles
├── components/
│   ├── ui.tsx              # All shared UI primitives
│   └── Charts.tsx          # SVG chart components
├── lib/
│   ├── types.ts            # TypeScript interfaces + constants
│   └── data.ts             # All localStorage CRUD + formatters
└── views/
    ├── DashboardView.tsx
    ├── ClientsView.tsx      # Includes ClientDrawer + ClientModal
    ├── ProjectsView.tsx     # Kanban + List toggle
    ├── InvoicesView.tsx
    ├── ApprovalsView.tsx
    ├── AnalyticsView.tsx
    ├── AIAssistantView.tsx
    └── ActivityLogView.tsx
```

## Data Models

All data lives in `localStorage` under these keys:
- `cinema_clients` — Client records
- `cinema_projects` — Project records
- `cinema_invoices` — Invoice records
- `cinema_activity_log` — Auto-logged activity entries
- `cinema_preferences` — UI preferences (view mode, last nav, etc.)

See `src/lib/types.ts` for full TypeScript interfaces.

## Views

| Route | View | Key Features |
|---|---|---|
| `/` | Dashboard | Stat cards, alert panels, activity feed, charts |
| `/clients` | Clients | Table with inline edit, health dots, detail drawer |
| `/projects` | Projects | Kanban drag & drop, list view, checklist modal |
| `/invoices` | Invoices | One-click mark paid, line items, stats bar |
| `/approvals` | Approvals | Card layout, approve/revision/copy message flow |
| `/analytics` | Analytics | MRR forecast, donut/bar/line charts, KPIs |
| `/ai` | AI Assistant | Chat interface, reads + writes all data |
| `/activity` | Activity Log | Paginated, filterable, CSV export |

## AI Assistant

The AI assistant uses Claude Haiku via a server-side route at `/api/ai`. It receives the full state of all clients, projects, invoices, and activity log with every request.

**Supported commands the AI can execute:**
`ADD_CLIENT`, `UPDATE_CLIENT`, `ADD_PROJECT`, `UPDATE_PROJECT`, `MOVE_PROJECT`, `MOVE_TO_APPROVALS`, `MARK_INVOICE_PAID`, `CREATE_INVOICE`, `MARK_SETUP_FEE_PAID`, `UPDATE_SUBSCRIPTION`, `ADD_NOTE`, `PIN_CLIENT`, `ARCHIVE_CLIENT`

**Example prompts:**
- "Which clients haven't paid their setup fee?"
- "Move Acme Co to Active subscription"
- "Create a $350 monthly invoice for all active clients"
- "What's my MRR right now?"

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (for AI) | Your Anthropic API key |

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Key Components

### `src/lib/data.ts`
All CRUD operations. Every mutation automatically writes to the activity log. Functions are plain TypeScript — no React hooks, safe to call from anywhere.

### `src/components/ui.tsx`
All shared primitives: `Btn`, `Badge`, `Modal`, `Confirm`, `FilterChips`, `SearchInput`, `InlineEdit`, `Checklist`, `BulkBar`, `ToastContainer`, `ShortcutBar`, `Tabs`, `HealthDot`, etc.

### `src/components/Charts.tsx`
Four custom SVG chart components with no external dependencies:
- `BarChartSimple` — vertical bar chart
- `LineChartSimple` — multi-series line chart with null gap support
- `StackedBarChart` — stacked bar chart
- `DonutChart` — donut/pie chart

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search |
| `Esc` | Close modal/drawer |
| `N` | New record (view-dependent) |

## Notes

- No seed data — all data comes from user input
- Health score is auto-calculated per client based on subscription status, invoice payment history, and days since last activity
- Overdue invoices are auto-detected on every page load
- The project view defaults to Kanban; preference is persisted
- All tables support bulk select → bulk actions (status change, archive, delete)
- Activity log keeps the last 500 entries
