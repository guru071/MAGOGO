# Task ID: 1 - Analytics API Builder

## Files Created
- `/src/app/api/admin/analytics/route.ts` - Real analytics API with date-range filtering
- `/src/app/api/admin/activity-logs/route.ts` - Paginated activity logs API
- `/src/app/api/admin/broadcasts/route.ts` - Broadcast GET (history) + POST (send to all users)

## Files Modified
- `/src/components/admin/Dashboard.tsx` - Removed all mock data, shows real DB data
- `/src/components/admin/AdminPanel.tsx` - DashboardWrapper now fetches analytics + activity-logs in parallel
- `/src/components/admin/AdminBroadcasts.tsx` - Real API integration with broadcast history
- `/src/components/admin/AdminActivity.tsx` - Full paginated activity log viewer with filters

## Key Design Decisions
- Analytics uses raw SQL with `strftime('%Y-%m-%d', createdAt)` for SQLite date grouping
- Time series gaps are filled with zero-value entries for smooth chart rendering
- Broadcasts are deduplicated in GET by grouping on title+message (since one row per user exists)
- Activity logs support both `action` and `userId` filtering with pagination
- All routes enforce admin-only access via `validateToken` + role check