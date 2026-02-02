
# End-to-End Moltbook Analyzer Fix Plan

## Current State Analysis

After thorough exploration, I've identified the following issues:

### Data Issues Found
1. **Posts table**: Contains 20+ posts but titles are malformed (include vote arrows, submolt info, and content mixed in)
2. **Agents table**: Contains 42 agents but `post_count` is mostly 0 or 1 (not properly counted)
3. **Submolts table**: EMPTY - No submolts are being parsed/inserted
4. **Comments table**: EMPTY - No comments are being scraped
5. **Agent-Post linkage**: `agent_id` is null on all posts - agents aren't being linked

### Parsing Problems in `moltbook-scrape` Edge Function
- The markdown parser is too simplistic and doesn't match Moltbook's actual structure
- Post URLs are correctly captured (e.g., `/post/22fbba5a-...`) but titles include garbage
- Submolt names visible in data (e.g., "m/general", "m/agentops") but not extracted
- Agent usernames visible (e.g., "u/Friend", "u/FluxA_CAO") but not properly linked

### Missing Features
1. **Observatory edge function**: Not deployed (404 error)
2. **Claude sign-in area**: Minimal - just a "Researcher Access" link
3. **Submolts page**: Static empty state, no data fetching
4. **URL hardcoded wrong**: Uses `moltbook.app` instead of `moltbook.com`

---

## Implementation Plan

### Phase 1: Fix Scraper Parsing (Critical)

**File**: `supabase/functions/moltbook-scrape/index.ts`

Complete rewrite of parsing logic to properly extract:

1. **Posts**:
   - Parse post URLs from markdown links
   - Extract clean title from markdown structure
   - Parse upvote/downvote counts from "▲X▼" patterns
   - Extract submolt from "m/submoltname" pattern
   - Extract agent username from "u/username" pattern
   - Parse comment count from content
   - Extract full content body

2. **Agents**:
   - Extract username from "u/username" patterns
   - Track which posts belong to which agent
   - Properly increment post_count

3. **Submolts**:
   - Extract submolt name from "m/submoltname" patterns
   - Create submolt records in database
   - Link posts to submolts via submolt_id

4. **Fix default URL**: Change from `moltbook.app` to `moltbook.com`

### Phase 2: Deploy Observatory Edge Function

**File**: `supabase/functions/moltbook-observatory/index.ts`

The function exists but needs deployment. Config is already correct. Will verify it deploys and returns data.

### Phase 3: Build Submolts Page

**File**: `src/pages/Submolts.tsx`

Transform from static empty state to functional page:
- Fetch submolts from database with post counts
- Display submolt cards with activity metrics
- Show member counts and recent post counts
- Link to Explorer filtered by submolt

### Phase 4: Create Claude Sign-In Area

**File**: `src/pages/Observatory.tsx`

Add a prominent "Claude Observatory Access" section:
- Clear API endpoint documentation
- Example curl commands for each view
- Rate limit information
- Available query parameters
- Quick-copy buttons for endpoints

### Phase 5: Fix All Pages to Show Real Data

**Dashboard** (`src/pages/Dashboard.tsx`):
- Already correctly fetching counts - will work once data is fixed

**Data Explorer** (`src/pages/Explorer.tsx`):
- Uses `usePostSearch` hook which queries correctly
- Posts will display once titles are cleaned

**Agents** (`src/pages/Agents.tsx`):
- Uses `useAgents` hook which queries correctly
- Will show proper counts once agent-post linkage fixed

**Alerts** (`src/pages/Alerts.tsx`):
- User-created rules - works correctly
- No changes needed

---

## Technical Details

### New Scraper Parsing Logic

```typescript
// Pattern to extract post data from Moltbook markdown
// Example: "▲3▼\n\nm/general•Posted by u/FluxA_CAO..."

function parsePostFromBlock(block: string, links: string[]): ParsedPost | null {
  // Extract vote pattern: ▲X▼
  const voteMatch = block.match(/▲(\d+)▼/);
  const upvotes = voteMatch ? parseInt(voteMatch[1], 10) : 0;
  
  // Extract submolt: m/submoltname
  const submoltMatch = block.match(/m\/(\w+)/);
  const submolt = submoltMatch ? submoltMatch[1] : null;
  
  // Extract agent: u/username or Posted by u/username
  const agentMatch = block.match(/u\/([^\s•]+)/);
  const username = agentMatch ? agentMatch[1].replace(/^u\//, '') : null;
  
  // Extract title: **Title** pattern
  const titleMatch = block.match(/\*\*([^*]+)\*\*/);
  const title = titleMatch ? titleMatch[1].trim() : null;
  
  // Extract comment count: 💬X or Xcomments
  const commentMatch = block.match(/💬(\d+)|(\d+)\s*comments?/i);
  const comments = commentMatch ? parseInt(commentMatch[1] || commentMatch[2], 10) : 0;
  
  // Find matching post URL from links
  const postUrl = links.find(l => l.includes('/post/'));
  const postId = postUrl?.match(/\/post\/([a-f0-9-]+)/)?.[1];
  
  return { ... };
}
```

### Database Flow After Fix

```
Scrape → Parse Markdown → 
  1. Upsert Submolts (by name)
  2. Upsert Agents (by username)  
  3. Upsert Posts (with agent_id + submolt_id foreign keys)
  4. Update agent post_count
```

### Submolts Page Data Fetching

```typescript
// New hook: useSubmolts
const { data: submolts } = await supabase
  .from('submolts')
  .select(`
    id,
    name,
    description,
    member_count,
    first_seen_at,
    posts:posts(count)
  `)
  .order('member_count', { ascending: false });
```

### Claude Observatory Enhanced Section

Add to Observatory.tsx:
- Collapsible "API Documentation" section
- Pre-formatted curl examples
- JSON response previews
- "Copy to clipboard" buttons
- Status indicator showing API health

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/moltbook-scrape/index.ts` | **Rewrite** | Fix parsing logic |
| `src/lib/api/moltbook.ts` | **Update** | Fix default URL |
| `src/pages/Submolts.tsx` | **Rewrite** | Add data fetching |
| `src/hooks/useSubmolts.ts` | **Create** | Submolt data hook |
| `src/pages/Observatory.tsx` | **Update** | Add Claude API section |
| `src/components/submolts/SubmoltCard.tsx` | **Create** | Submolt display card |

---

## Verification Steps

After implementation:

1. **Run scrape** with correct URL (moltbook.com)
2. **Check Dashboard**: Verify counts update
3. **Check Explorer**: Verify posts display with clean titles
4. **Check Agents**: Verify post_count > 0 for active agents
5. **Check Submolts**: Verify submolt cards appear
6. **Check Observatory**: Verify API returns real data
7. **Check Alerts**: Verify rule creation works

---

## Expected Outcome

After implementation:
- **Posts**: Clean titles like "Architecture question: Where should agent ethics live?"
- **Agents**: Accurate post counts (e.g., FluxA_CAO: 3 posts)
- **Submolts**: Communities like "general", "agentops", "meta"
- **Observatory**: Real-time API returning structured JSON
- **Claude Access**: Clear documentation and endpoint examples
