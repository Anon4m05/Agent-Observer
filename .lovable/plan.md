

# Claude Observatory API Expansion Plan

## Overview

This plan expands the existing `moltbook-observatory` edge function from a read-only public API with 3 views into a comprehensive research interface with 11 endpoints (7 read + 4 action), differentiated rate limits, and standardized response formatting.

## Current State

The existing Observatory API supports:
- `GET ?view=summary` - Ecosystem stats
- `GET ?view=agents` - Agent list with fingerprints  
- `GET ?view=posts` - Recent posts
- Rate limit: 10 req/min (all endpoints)
- Auth: `x-observatory-key` header (only checked for alerts view)

## Architecture Changes

```text
┌─────────────────────────────────────────────────────────────┐
│                   moltbook-observatory                       │
├─────────────────────────────────────────────────────────────┤
│  Request → Auth Check → Rate Limiter → Router → Handler     │
│                                                              │
│  Rate Limits:                                                │
│  ├── Read endpoints:   30 req/min                           │
│  ├── Action endpoints: 10 req/min                           │
│  └── Scrape trigger:   1 per 5 min                          │
│                                                              │
│  Read Views (GET):     │  Actions (POST):                   │
│  ├── summary           │  ├── action=scrape                 │
│  ├── agents            │  ├── action=create_alert           │
│  ├── posts             │  ├── action=mark_alerts_read       │
│  ├── comments          │  └── (future: more actions)        │
│  ├── submolts          │                                     │
│  ├── alerts            │                                     │
│  ├── scrape_jobs       │                                     │
│  └── search            │                                     │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Update Edge Function Entry Point

Modify `supabase/functions/moltbook-observatory/index.ts` to:
- Accept both GET and POST requests
- Implement tiered rate limiting (30/10/1 per endpoint type)
- Add proper auth validation using `CLAUDE_OBSERVATORY_KEY`
- Standardize all responses with success/pagination format

### 2. New Read Endpoints

**Comments (GET ?view=comments&post_id=xxx)**
- Query the `comments` table
- Return threaded structure with parent_id
- Include agent usernames and vote counts

**Submolts (GET ?view=submolts)**
- Query the `submolts` table with member counts
- Join to get post counts per submolt
- Support sorting by members/activity/recent

**Alerts (GET ?view=alerts)**
- Fetch from `alert_rules` and `alerts` tables
- Use service role to bypass RLS (Claude-specific access)
- Return rules, triggered alerts, and unread count

**Scrape History (GET ?view=scrape_jobs)**
- Query `scrape_jobs` table
- Return recent job history with status and results

**Search (GET ?view=search&q=query)**
- Full-text search across posts, agents, and submolts
- Return categorized results with relevance scoring

### 3. New Action Endpoints

**Trigger Scrape (POST ?action=scrape)**
- Create a new scrape job record
- Call the existing `moltbook-scrape` function internally
- Rate limited to 1 per 5 minutes
- Return job_id for status tracking

**Create Alert Rule (POST ?action=create_alert)**
- Insert into `alert_rules` table using service role
- Uses a special "claude" user record for ownership
- Returns the created rule

**Mark Alerts Read (POST ?action=mark_alerts_read)**
- Update `alerts` table to mark as read
- Accept specific alert_ids or all=true

### 4. Response Format Standardization

All responses will follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

interface ApiError {
  success: false;
  error: string;
  code: string;
}
```

### 5. Rate Limiting Implementation

```typescript
// Three-tier rate limiting
const RATE_LIMITS = {
  read: { limit: 30, window: 60000 },      // 30/min
  action: { limit: 10, window: 60000 },    // 10/min
  scrape: { limit: 1, window: 300000 },    // 1/5min
};

// Track per-endpoint-type
const rateLimiters = {
  read: new Map<string, RateLimitEntry>(),
  action: new Map<string, RateLimitEntry>(),
  scrape: new Map<string, RateLimitEntry>(),
};
```

### 6. Authentication Enhancement

All endpoints now require the `x-observatory-key` header:
- Validate against `CLAUDE_OBSERVATORY_KEY` secret
- Return 401 for missing/invalid keys
- Log all authenticated requests for audit

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/moltbook-observatory/index.ts` | Complete rewrite with new endpoints |
| `src/lib/api/observatory.ts` | Add new endpoint methods for frontend |
| `src/components/observatory/ClaudeApiDocs.tsx` | Update documentation with new endpoints |

## Database Considerations

**Claude User for Alert Ownership**

Since alerts require a `user_id`, we'll use a system approach:
- Alerts created by Claude will use `user_id = NULL` with a special `created_by = 'claude'` metadata field
- Alternatively, create a dedicated "claude" system user and store the ID in a secret

The simplest approach: Store Claude's alerts with the observatory key hash as an identifier in the metadata field, queried using service role.

## New Endpoint Specifications

### Read Endpoints

| Endpoint | Parameters | Returns |
|----------|------------|---------|
| `?view=summary` | none | Ecosystem stats, notable agents, recent posts |
| `?view=agents` | limit, offset, sort, since | Agent list with behavioral data |
| `?view=posts` | limit, offset, sort, submolt, agent, since | Full post content |
| `?view=comments` | post_id, limit | Threaded comments for a post |
| `?view=submolts` | limit, sort | Community directory |
| `?view=alerts` | none | Alert rules and triggered alerts |
| `?view=scrape_jobs` | limit | Recent scrape history |
| `?view=search` | q, type | Search results across entities |

### Action Endpoints

| Endpoint | Body | Returns |
|----------|------|---------|
| `?action=scrape` | `{ scope, target_id? }` | `{ job_id, status }` |
| `?action=create_alert` | `{ name, type, target, threshold? }` | `{ rule_id, created }` |
| `?action=mark_alerts_read` | `{ alert_ids } or { all: true }` | `{ updated_count }` |

## Security Boundaries

**What Claude CAN do:**
- Read all public data (posts, agents, submolts, comments)
- View scrape job history
- Trigger new scrapes (rate limited)
- Create alert rules (stored with claude identifier)
- Mark alerts as read
- Search across all content

**What Claude CANNOT do:**
- Register agents on Moltbook
- Post content
- Comment on posts
- Vote (upvote/downvote)
- Delete any data
- Access researcher user data

## Testing Strategy

After implementation:
1. Test each read endpoint with valid auth
2. Test action endpoints with rate limiting
3. Verify scrape trigger only fires once per 5 min
4. Confirm alert creation works without user_id conflicts
5. Test search across all entity types

