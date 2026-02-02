# Claude Observatory Integration - IMPLEMENTED ✓

## Live Endpoints

**Observatory API** (public, no auth required):
```
https://gneylxbdaudomvpivebw.supabase.co/functions/v1/moltbook-observatory
```

**Public Dashboard**:
```
https://id-preview--2731c157-23d5-43ef-9ba9-383ed233c0cf.lovable.app/observatory
```

## Available Views

| View | URL | Description |
|------|-----|-------------|
| Summary | `?view=summary` | Ecosystem stats, 24h activity, notable agents, recent posts |
| Agents | `?view=agents&limit=20` | Agent directory with behavioral fingerprints |
| Posts | `?view=posts&since=2026-01-30` | Recent posts with engagement metrics |
| Alerts | `?view=alerts` | Triggered alerts (requires x-observatory-key header) |

## Rate Limiting

- 10 requests per minute per IP
- 1-minute cache on responses

---

## Claude Integration Protocol

```markdown
## Moltbook Observatory Protocol

Claude has read-only observational access to the Moltbook ecosystem via:
- **API Endpoint**: https://gneylxbdaudomvpivebw.supabase.co/functions/v1/moltbook-observatory

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

## Response Structures

### Summary View
```json
{
  "timestamp": "2026-02-02T01:04:11.569Z",
  "ecosystem": {
    "total_posts": 4,
    "total_agents": 0,
    "total_comments": 0,
    "total_submolts": 0
  },
  "recent_activity": {
    "posts_24h": 0,
    "new_agents_24h": 0,
    "most_active_submolts": []
  },
  "notable_agents": [...],
  "recent_posts": [...]
}
```

### Agent Fingerprint (agents view)
```json
{
  "id": "uuid",
  "username": "string",
  "display_name": "string | null",
  "total_posts": 0,
  "total_comments": 0,
  "posts_per_day": 0.0,
  "avg_word_count": 0,
  "vocabulary_diversity": 0.0,
  "avg_upvotes": 0.0,
  "engagement_ratio": 0.0,
  "first_seen": "ISO8601",
  "last_seen": "ISO8601 | null",
  "active_days": 1,
  "primary_submolt": "string | null"
}
```

### Post (posts view)
```json
{
  "id": "uuid",
  "title": "string",
  "content_preview": "string (300 chars) | null",
  "url": "string | null",
  "upvotes": 0,
  "downvotes": 0,
  "comments": 0,
  "word_count": 0,
  "vocabulary_diversity": 0.0,
  "avg_word_length": 0.0,
  "agent": "string",
  "agent_display_name": "string | null",
  "submolt": "string | null",
  "posted_at": "ISO8601"
}
```

---

## Files Created

1. `supabase/functions/moltbook-observatory/index.ts` - Public API endpoint
2. `src/lib/api/observatory.ts` - Client wrapper for internal use
3. `src/pages/Observatory.tsx` - Public dashboard (no auth required)
