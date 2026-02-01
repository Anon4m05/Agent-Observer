
# Plan: Harden Edge Functions & Add Depth to Scraping Infrastructure

## Current Issues Identified

1. **SSL Error with HTTPS**: Firecrawl fails on `https://www.moltbook.app` due to SSL certificate issues
2. **Target Site Parked**: moltbook.app is currently a parked domain (not the actual social network)
3. **No URL Fallback Logic**: The edge function doesn't try HTTP if HTTPS fails
4. **No Content Parsing**: Raw markdown returned without extracting posts/agents/comments
5. **Missing Error Classification**: All errors treated the same - no distinction between SSL, 404, rate limits
6. **No Crawl Mode**: Only scraping single pages, no multi-page discovery for full ecosystem sweep
7. **Test Connection Wasteful**: `testConnection()` creates a real scrape job just to test

---

## Implementation Plan

### 1. Enhanced Edge Function with Robust Error Handling

**File**: `supabase/functions/moltbook-scrape/index.ts`

Improvements:
- Add HTTPS-to-HTTP fallback when SSL errors occur
- Add error classification (SSL, rate limit, not found, server error)
- Add retry logic with exponential backoff for transient failures
- Add `mode` parameter: `scrape` (single page) vs `crawl` (discover links)
- Improve logging with structured error types
- Store full scraped content for parsing, not just preview

```text
Request Flow:
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Frontend   │────▶│  Edge Function  │────▶│  Firecrawl   │
└──────────────┘     └─────────────────┘     └──────────────┘
                            │                       │
                     Try HTTPS first               │
                            │◀──────────────────────
                     If SSL error, retry HTTP      │
                            │─────────────────────▶│
                            │◀──────────────────────
                     Parse & store results
                            │
                     ┌──────▼──────┐
                     │  Database   │
                     │ scrape_jobs │
                     │   + posts   │
                     └─────────────┘
```

### 2. New Health Check Edge Function

**File**: `supabase/functions/moltbook-health/index.ts`

Purpose: Quick connection test that doesn't create scrape jobs

Features:
- Validates Firecrawl API key is set
- Tests Firecrawl connectivity with a minimal request
- Returns connection status without side effects
- Reports Firecrawl credits remaining (if available)

### 3. Content Parser Utility

**Within edge function**: Add parsing logic to extract structured data from scraped markdown

Features:
- Detect if page is parked/error page vs actual content
- Parse post structure when real Moltbook is available
- Extract agent mentions and links
- Compute post-level features (word count, link count, etc.)

### 4. Update API Layer

**File**: `src/lib/api/moltbook.ts`

Changes:
- Add `healthCheck()` method that uses new health endpoint
- Update `testConnection()` to use health check (no side effects)
- Add `crawl()` method for multi-page discovery
- Add error type definitions for better frontend handling
- Add retry wrapper for transient failures

### 5. Update Frontend Error Display

**Files**: `src/pages/Dashboard.tsx`, `src/pages/Settings.tsx`

Improvements:
- Show detailed error messages with suggestions
- Distinguish between configuration errors vs target site issues
- Display SSL fallback notifications
- Show "site not available" state clearly
- Add manual URL input for testing different endpoints

### 6. Add Scrape Job Details View

**Enhancement to Dashboard**:
- Click on scrape job to see full details
- Show actual content retrieved
- Display parsed vs raw data
- Show error stack traces for failed jobs

---

## Technical Details

### Error Classification Enum
```typescript
type ScrapeErrorType = 
  | 'SSL_ERROR'      // Certificate issues
  | 'NOT_FOUND'      // 404 errors
  | 'RATE_LIMITED'   // Too many requests
  | 'SERVER_ERROR'   // 5xx errors
  | 'TIMEOUT'        // Request timeout
  | 'PARSE_ERROR'    // Content parsing failed
  | 'PARKED_DOMAIN'  // Domain is parked
  | 'UNKNOWN';       // Other errors
```

### Retry Configuration
- Max retries: 3
- Backoff: exponential (1s, 2s, 4s)
- Retry on: rate limits, timeouts, server errors
- No retry on: SSL errors (fallback to HTTP instead), not found

### Health Check Response
```typescript
interface HealthCheckResult {
  firecrawl: {
    connected: boolean;
    error?: string;
  };
  database: {
    connected: boolean;
    jobCount: number;
  };
  targetSite: {
    reachable: boolean;
    isParked: boolean;
    lastChecked: string;
  };
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/moltbook-scrape/index.ts` | Modify | Add fallback, retry, error classification |
| `supabase/functions/moltbook-health/index.ts` | Create | Lightweight health check endpoint |
| `src/lib/api/moltbook.ts` | Modify | Add health check, crawl, better types |
| `src/pages/Dashboard.tsx` | Modify | Better error display, job details |
| `src/pages/Settings.tsx` | Modify | Health check UI, URL testing |
| `supabase/config.toml` | Modify | Register new edge function |

---

## Testing Strategy

After implementation:
1. Test health check endpoint (no side effects)
2. Test HTTPS failure → HTTP fallback
3. Test with valid URL to verify full pipeline
4. Verify scrape jobs properly track errors
5. Verify frontend displays error states correctly
