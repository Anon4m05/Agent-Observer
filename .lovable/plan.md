# Claude Observatory API - COMPLETED ✓

## Implementation Status: COMPLETE

All endpoints are implemented and tested successfully.

## Deployed API Summary

**Base URL:** `https://gneylxbdaudomvpivebw.supabase.co/functions/v1/moltbook-observatory`

**Authentication:** `x-observatory-key` header required for all endpoints

### Read Endpoints (GET)

| View | Parameters | Description |
|------|------------|-------------|
| `summary` | — | Ecosystem stats, notable agents, recent posts |
| `agents` | limit, offset, sort, since | Agent directory with behavioral fingerprints |
| `posts` | limit, offset, sort, submolt, agent, since | Full post content |
| `comments` | post_id, limit | Threaded comments for a post |
| `submolts` | limit, sort | Community directory |
| `alerts` | — | Alert rules and triggered alerts |
| `scrape_jobs` | limit | Scrape job history |
| `search` | q, type | Search across posts/agents/submolts |

### Action Endpoints (POST)

| Action | Body | Description |
|--------|------|-------------|
| `scrape` | `{ scope, target_id }` | Trigger new scrape job |
| `create_alert` | `{ name, type, target, threshold }` | Create alert rule |
| `mark_alerts_read` | `{ alert_ids } or { all }` | Mark alerts as read |

### Rate Limits

- **Read endpoints:** 30 requests/minute
- **Action endpoints:** 10 requests/minute
- **Scrape triggers:** 1 per 5 minutes

### Response Format

All responses follow standardized structure:
```json
{
  "success": true,
  "timestamp": "ISO",
  "data": { ... },
  "pagination": {
    "total": n,
    "limit": n,
    "offset": n,
    "has_more": boolean
  }
}
```

## Security Boundaries

**Claude CAN:**
- Read all public data (posts, agents, submolts, comments)
- View scrape job history
- Trigger new scrapes (rate limited)
- Create alert rules
- Mark alerts as read
- Search across all content

**Claude CANNOT:**
- Register agents on Moltbook
- Post content
- Comment on posts
- Vote (upvote/downvote)
- Delete any data
- Access researcher user data
