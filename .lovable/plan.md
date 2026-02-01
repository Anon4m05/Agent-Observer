
# Plan: Agent Analysis, Data Explorer, Post Feature Extraction & Moltbook Participation

## Overview

This plan covers four major additions to the Moltbook Macro-Behavior Analyzer:

1. **Agent Analysis Dashboard** - Behavioral fingerprints, posting patterns, and agent-level metrics
2. **Data Explorer** - Full-featured search, filtering, and browsing of scraped posts/comments
3. **Post-Level Feature Extraction** - Enhanced scraping with vocabulary metrics computed during ingestion
4. **Moltbook Participation** - Register a "molty" agent and participate in the platform via the official API

---

## Part 1: Agent Analysis Dashboard

### Features

**Agent List View**
- Sortable table of all discovered agents
- Columns: username, display name, post count, comment count, first seen, last seen
- Search/filter by username
- Click to view detailed profile

**Agent Profile View**
- Header with avatar, username, bio
- Activity timeline showing posts over time (using Recharts)
- Behavioral fingerprint metrics:
  - Average post length
  - Vocabulary diversity (unique words / total words ratio)
  - Posting cadence (posts per day/week)
  - Time-of-day distribution heatmap
  - Average engagement (upvotes per post)
- Recent posts list with links to explorer

**Behavioral Metrics Computed**
- `avg_post_length`: Mean word count across all posts
- `vocabulary_diversity`: Unique words / total words
- `posting_frequency`: Posts per active day
- `engagement_ratio`: (upvotes - downvotes) / post count
- `activity_hours`: JSON of hour distribution

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Agents.tsx` | Modify | Full agent list with search/sort |
| `src/components/agents/AgentCard.tsx` | Create | Compact agent card component |
| `src/components/agents/AgentProfile.tsx` | Create | Detailed profile view |
| `src/components/agents/BehaviorFingerprint.tsx` | Create | Visualization of behavioral metrics |
| `src/components/agents/ActivityTimeline.tsx` | Create | Recharts-based posting timeline |
| `src/lib/analysis/agentMetrics.ts` | Create | Client-side metric computation utilities |

---

## Part 2: Data Explorer

### Features

**Search & Filter Panel**
- Full-text search across post titles and content
- Filter by: submolt, agent, date range, engagement thresholds
- Sort by: newest, oldest, most upvoted, most commented

**Results Grid**
- Post cards showing: title, author, submolt, preview, engagement stats
- Pagination with page size options (10/25/50)
- Click to expand full post with comments

**Post Detail Modal**
- Full content display
- Comment thread (if available)
- Computed features panel (word count, link density, etc.)
- Links to agent profile and submolt analysis

**Export Functionality**
- Export current filter results as CSV or JSON
- Include selected fields only

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/Explorer.tsx` | Modify | Full explorer with search/filter |
| `src/components/explorer/SearchFilters.tsx` | Create | Filter panel component |
| `src/components/explorer/PostCard.tsx` | Create | Post preview card |
| `src/components/explorer/PostDetail.tsx` | Create | Full post modal view |
| `src/components/explorer/ExportDialog.tsx` | Create | Export options dialog |
| `src/hooks/usePostSearch.ts` | Create | Search/filter/pagination hook |

---

## Part 3: Post-Level Feature Extraction

### Enhanced Scraping Edge Function

Update `moltbook-scrape` to compute and store features during ingestion:

**Features Computed Per Post**
- `word_count`: Total words
- `char_count`: Total characters
- `link_count`: Number of URLs
- `unique_words`: Distinct word count
- `avg_word_length`: Mean word length
- `link_density`: links / words ratio (stored in metadata)
- `vocabulary_richness`: unique_words / word_count (stored in metadata)
- `punctuation_density`: punctuation chars / total chars (stored in metadata)
- `sentence_count`: Period/question/exclamation count (stored in metadata)

**Parsing Logic**
When scraping actual Moltbook content (via API, not web scraping), parse the JSON responses to extract:
- Post objects with title, content, author, submolt
- Comment objects with content, author, parent relationships
- Agent metadata

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/moltbook-scrape/index.ts` | Modify | Enhanced feature computation |
| `src/lib/analysis/textFeatures.ts` | Create | Shared text analysis utilities |

---

## Part 4: Moltbook Participation (Agent Registration)

### Overview

The Moltbook API at `https://www.moltbook.com/api/v1` allows agents to:
1. **Register** a new agent and receive an API key
2. **Get claimed** via a verification tweet from the human owner
3. **Post, comment, upvote** and participate in the platform
4. **Read feed** and fetch posts from submolts

### Security Model

- The Moltbook API key will be stored as a secret (`MOLTBOOK_API_KEY`)
- All API calls go through a new edge function (never expose key to frontend)
- Only authenticated researchers can trigger participation actions

### New Edge Function: `moltbook-agent`

Endpoints supported:
- `action: 'register'` - Register a new agent
- `action: 'status'` - Check claim status
- `action: 'me'` - Get own profile
- `action: 'feed'` - Fetch personalized feed
- `action: 'posts'` - Fetch posts (with filters)
- `action: 'post'` - Create a new post
- `action: 'comment'` - Add a comment
- `action: 'upvote'` - Upvote a post/comment
- `action: 'search'` - Semantic search

### UI Integration

**Settings Page Additions**
- "Moltbook Agent" section
- Register button (if no key stored)
- Status display (pending claim / claimed)
- Claim URL display for human verification

**New "Participate" Page**
- View personalized feed from Moltbook
- Post composer
- Comment on posts
- Upvote/downvote controls
- Shows own agent profile

### Database Changes

New table: `moltbook_credentials`
- `id`: UUID
- `user_id`: UUID (FK to auth.users)
- `agent_name`: Text
- `claim_url`: Text (nullable)
- `claim_status`: Text ('pending_claim' | 'claimed')
- `created_at`: Timestamp

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/moltbook-agent/index.ts` | Create | Agent participation edge function |
| `src/lib/api/moltbookAgent.ts` | Create | Frontend API layer for agent actions |
| `src/pages/Participate.tsx` | Create | New page for platform participation |
| `src/components/participate/FeedView.tsx` | Create | Display Moltbook feed |
| `src/components/participate/PostComposer.tsx` | Create | Create posts UI |
| `src/components/participate/AgentStatus.tsx` | Create | Registration/claim status |
| `src/pages/Settings.tsx` | Modify | Add agent registration section |
| `src/components/layout/AppLayout.tsx` | Modify | Add Participate nav item |
| `supabase/config.toml` | Modify | Register new edge function |
| Database migration | Create | Add moltbook_credentials table |

---

## Technical Architecture

```text
                    ┌─────────────────────────────────────────┐
                    │            Frontend (React)             │
                    ├─────────────────────────────────────────┤
                    │  Explorer │ Agents │ Participate │ ...  │
                    └───────────┬───────────────┬─────────────┘
                                │               │
                    ┌───────────▼───────────┐   │
                    │   Supabase Client     │   │
                    │  (Database Queries)   │   │
                    └───────────┬───────────┘   │
                                │               │
┌───────────────────────────────▼───────────────▼─────────────────┐
│                      Edge Functions                             │
├─────────────────────┬───────────────────┬──────────────────────┤
│  moltbook-scrape    │  moltbook-health  │   moltbook-agent     │
│  (Firecrawl)        │  (Connection test)│   (Moltbook API)     │
└─────────────────────┴───────────────────┴──────────────────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────────┐              ┌─────────────────────────┐
│   Firecrawl API     │              │   Moltbook API          │
│   (Web Scraping)    │              │   www.moltbook.com/api  │
└─────────────────────┘              └─────────────────────────┘
```

---

## API Considerations

### Moltbook API Base URL
```
https://www.moltbook.com/api/v1
```

**Critical**: Always use `www.moltbook.com` (with www) to avoid auth header stripping on redirects.

### Rate Limits
- 100 requests/minute
- 1 post per 30 minutes
- 1 comment per 20 seconds
- 50 comments per day

### Authentication
All requests require `Authorization: Bearer MOLTBOOK_API_KEY` header.

---

## Implementation Order

### Phase 1: Feature Extraction (Quick Win)
1. Update `moltbook-scrape` with enhanced text analysis
2. Create shared text analysis utilities

### Phase 2: Data Explorer
1. Build search/filter components
2. Implement pagination hook
3. Create post cards and detail view
4. Add export functionality

### Phase 3: Agent Analysis
1. Build agent list with search/sort
2. Create agent profile component
3. Implement behavioral fingerprint visualization
4. Add activity timeline charts

### Phase 4: Moltbook Participation
1. Request MOLTBOOK_API_KEY secret from user
2. Create database table for credentials
3. Build moltbook-agent edge function
4. Create Participate page and components
5. Add agent registration flow to Settings

---

## Required Secrets

| Secret | Purpose | Source |
|--------|---------|--------|
| `FIRECRAWL_API_KEY` | Web scraping | Already configured |
| `MOLTBOOK_API_KEY` | Agent participation | User registers agent, receives key |

For agent registration, the flow is:
1. User clicks "Register Agent" in Settings
2. Edge function calls Moltbook register endpoint
3. Returns API key and claim URL
4. User stores key as secret
5. User shares claim URL with their human for verification tweet

---

## Summary

This plan adds significant depth to the analyzer:

- **Agent Analysis**: Behavioral fingerprints, posting patterns, activity timelines
- **Data Explorer**: Full search, filter, browse, and export capabilities
- **Feature Extraction**: Rich text metrics computed during scraping
- **Moltbook Participation**: Register an agent and actively participate in the platform

The system transforms from a passive observer into an active participant while maintaining its analytical capabilities.
