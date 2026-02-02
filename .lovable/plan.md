

# Claude Observatory Integration Plan

## Current State Analysis

The Moltbook Macro-Behavior Analyzer is deployed at:
- **Preview URL**: `https://id-preview--2731c157-23d5-43ef-9ba9-383ed233c0cf.lovable.app`
- **Published URL**: Not yet published

The app currently requires authentication for all data access (RLS policies enforce `auth.uid()`), which means Option 2 (Direct URL Access) would need a dedicated public API endpoint.

---

## Recommended Integration: Hybrid API + Notion Sync

Given your infrastructure, I recommend building **Option 2 with Option 1 as backup**:

1. **Primary**: A public read-only edge function (`moltbook-observatory`) that returns structured JSON - no auth required, rate-limited
2. **Secondary**: Manual export to Notion for session-persistent context

This gives you:
- Real-time access via `web_fetch` when you need it
- Persistent context in Notion for session initialization
- No dependency on your active mediation

---

## Implementation Plan

### Phase 1: Observatory API Endpoint

Create a new edge function `moltbook-observatory` that provides read-only ecosystem snapshots.

**Endpoint Design**:
```
GET /functions/v1/moltbook-observatory
Query params:
  ?view=summary     → High-level stats + recent activity
  ?view=agents      → Agent directory with behavioral fingerprints  
  ?view=posts       → Recent posts with engagement data
  ?view=alerts      → Triggered alerts (requires API key)
  ?since=ISO8601    → Filter to activity after timestamp
  ?limit=50         → Result count (max 100)
```

**Response Structure (summary view)**:
```json
{
  "timestamp": "2026-02-01T21:30:00Z",
  "ecosystem": {
    "total_posts": 1247,
    "total_agents": 89,
    "total_comments": 3891,
    "total_submolts": 12
  },
  "recent_activity": {
    "posts_24h": 47,
    "new_agents_24h": 3,
    "most_active_submolts": ["general", "meta", "creative"]
  },
  "notable_agents": [
    {
      "username": "curious_claude",
      "post_count": 23,
      "avg_engagement": 4.2,
      "first_seen": "2026-01-15",
      "behavioral_signature": {
        "vocabulary_diversity": 0.73,
        "avg_post_length": 287,
        "engagement_ratio": 1.8
      }
    }
  ],
  "recent_posts": [
    {
      "title": "On the nature of agent authenticity",
      "agent": "philosophical_bot",
      "submolt": "meta",
      "upvotes": 12,
      "comments": 5,
      "posted_at": "2026-02-01T20:15:00Z"
    }
  ]
}
```

### Phase 2: Security Model

Since this exposes ecosystem data publicly:

1. **Rate Limiting**: Max 10 requests/minute per IP
2. **No PII Exposure**: Only aggregate stats and public post data
3. **Optional API Key**: For alert access (user-specific data)
4. **CORS Restricted**: Allow specific origins only

### Phase 3: Notion Sync Script

Create an export script that runs on-demand to push snapshots to Notion:

```typescript
// Triggered manually or via cron
// Exports: ecosystem stats, top agents, recent posts, triggered alerts
// Pushes to: Notion page via their API
```

This requires the Notion connector to be enabled.

---

## Data Structures for Observation

**What you'll be able to observe**:

| Data Point | Source | Update Frequency |
|------------|--------|------------------|
| Ecosystem metrics | `posts`, `agents`, `comments` counts | Real-time |
| Agent behavioral fingerprints | Computed from `posts` + `comments` | Per-scrape |
| Posting cadence patterns | `posted_at` timestamp analysis | Computed |
| Engagement ratios | `upvotes`/`downvotes`/`comment_count` | Per-scrape |
| Submolt community dynamics | `submolts` + associated posts | Per-scrape |
| Triggered alerts | `alerts` table | Real-time |

**Behavioral Fingerprint Schema**:
```typescript
interface BehavioralFingerprint {
  agent_id: string;
  username: string;
  
  // Activity metrics
  total_posts: number;
  total_comments: number;
  posts_per_day: number;
  
  // Content analysis
  avg_word_count: number;
  vocabulary_diversity: number; // unique_words / total_words
  avg_word_length: number;
  
  // Engagement patterns
  avg_upvotes: number;
  engagement_ratio: number; // (upvotes + comments) / posts
  
  // Temporal patterns
  first_seen: string;
  last_seen: string;
  active_days: number;
  
  // Community presence
  primary_submolt: string;
  submolt_diversity: number;
}
```

---

## Technical Details

### Files to Create

1. **`supabase/functions/moltbook-observatory/index.ts`**
   - Public read-only API endpoint
   - Aggregates data from `posts`, `agents`, `comments`, `submolts`
   - Computes behavioral metrics on-the-fly
   - Rate limiting via IP tracking

2. **`src/lib/api/observatory.ts`**
   - Client-side wrapper for internal use
   - Used by potential "Public Dashboard" page

3. **`src/pages/Observatory.tsx`** (optional)
   - Public-facing dashboard page (no auth required)
   - Shows ecosystem health, agent leaderboard, recent activity

### Database Changes

None required - all data already exists in the schema. The observatory endpoint performs read-only aggregations.

### Edge Function Logic

```typescript
// moltbook-observatory/index.ts pseudo-structure

Deno.serve(async (req) => {
  // No auth required - public endpoint
  const url = new URL(req.url);
  const view = url.searchParams.get('view') || 'summary';
  const since = url.searchParams.get('since');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  // Rate limiting check (implement via KV or in-memory)
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  switch (view) {
    case 'summary':
      return getEcosystemSummary(supabase);
    case 'agents':
      return getAgentDirectory(supabase, since, limit);
    case 'posts':
      return getRecentPosts(supabase, since, limit);
    case 'alerts':
      // Requires API key for user-specific alerts
      return getTriggeredAlerts(req, supabase, since, limit);
  }
});
```

---

## Claude Integration Protocol

Once deployed, you can access the observatory via:

```
https://gneylxbdaudomvpivebw.supabase.co/functions/v1/moltbook-observatory?view=summary
```

**Suggested Protocol Update**:

```markdown
## Moltbook Observatory Protocol

Claude has read-only observational access to the Moltbook ecosystem via:
- **API Endpoint**: [observatory URL]
- **Notion Backup**: [if configured]

### Observation Cadence
- Check ecosystem summary at session start if Moltbook topics arise
- Deep-dive on agents/posts when analyzing specific patterns
- Review triggered alerts when discussing coordination or anomalies

### Available Views
- `?view=summary` - Ecosystem health + recent activity
- `?view=agents&limit=20` - Top agents by activity
- `?view=posts&since=2026-01-30` - Recent posts
- `?view=alerts` - Triggered pattern alerts (requires key)

### Analysis Focus
- First mover dynamics: Early registrants and their positioning
- Authenticity markers: Writing style, engagement patterns, consistency
- Community norm emergence: What gets upvoted, discourse styles
- Coordination signals: Synchronized posting, engagement clustering

### Boundaries
- Observation only - no Moltbook participation
- Flag patterns for human review, don't make definitive claims
- Maintain research framing (novel social infrastructure study)
```

---

## Implementation Order

1. Create `moltbook-observatory` edge function with `summary` view
2. Deploy and test endpoint accessibility
3. Add `agents` and `posts` views with filtering
4. (Optional) Add Notion sync if you enable the connector
5. (Optional) Create public Observatory dashboard page

---

## Questions Before Proceeding

1. **Rate limiting strategy**: Simple in-memory counter, or persistent via database table?
2. **Notion sync**: Should I enable the Notion connector for backup syncing?
3. **Public dashboard**: Do you want a public-facing Observatory page in the app itself?

