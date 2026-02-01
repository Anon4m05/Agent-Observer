
# Moltbook Macro-Behavior Analyzer

## Overview
A dark-themed research terminal for observing, measuring, and analyzing large-scale behavioral patterns on Moltbook - the social network for AI agents. The system treats Moltbook as a live ecosystem, producing reproducible analyses without posting, spawning agents, or impersonation.

---

## Phase 1: Foundation & Trust Boundary

### 1.1 Researcher Authentication
- Simple login/signup for single researcher access
- Secure session management
- Settings page for configuration

### 1.2 Data Source Connection
- Input field for Moltbook observation credentials (if available in future)
- Firecrawl connector integration for web scraping approach
- Connection validation with test request
- Encrypted server-side storage of credentials
- Clear status indicators showing connection health

---

## Phase 2: Data Ingestion Engine

### 2.1 Scraping Infrastructure
- Edge function to scrape Moltbook pages using Firecrawl
- Target endpoints: public posts, comments, agent profiles, submolts
- Pagination handling for large result sets
- Rate limiting and exponential backoff
- Error handling with retry logic

### 2.2 Manual Trigger Interface
- Dashboard control panel with "Fetch New Data" button
- Scope selector: specific submolts, specific agents, or full sweep
- Progress indicator showing scrape status
- Fetch history log

### 2.3 Scheduled Polling (Optional)
- Toggle to enable/disable automatic background collection
- Configurable interval (hourly, every 6 hours, daily)
- Checkpoint system tracking last successful fetch
- Background job using Supabase pg_cron

### 2.4 Append-Only Archive
- Database tables for: posts, comments, agents, submolts
- Immutable records with: IDs, timestamps, content, authors, reply structure, engagement metrics
- Versioned snapshots for reproducibility
- Data integrity checksums

---

## Phase 3: Feature Extraction Layer

### 3.1 Post-Level Features (Computed on Ingest)
- **Basic metrics**: Length, word count, link density, domain usage
- **Lexical analysis**: Vocabulary diversity, repetition patterns
- **Structural**: Reply depth, thread position
- **Optional AI**: Embedding vectors (via Lovable AI when enabled)

### 3.2 Agent-Level Features (Computed on Demand)
- **Temporal patterns**: Posting cadence, burstiness, time-of-day distribution
- **Stylistic fingerprints**: Average length, vocabulary profile, punctuation patterns
- **Self-similarity**: How consistent is this agent over time?
- **Cross-agent similarity**: Who writes similarly to whom?

### 3.3 Submolt-Level Features
- Activity volume over time
- Agent diversity (unique posters, concentration)
- Topic dispersion
- Semantic centroid (average topic position)

---

## Phase 4: Analysis Dashboards

### 4.1 Data Explorer
- Browse raw posts and comments with filters
- Search by agent, submolt, keyword, date range
- Drill-down from any metric to source data
- Export selections as CSV/JSON

### 4.2 Ecosystem Overview Dashboard
- Activity heatmap: posts/comments over time
- Top agents by volume, engagement
- Most active submolts
- Concentration metrics: how concentrated is activity?

### 4.3 Agent Analysis Dashboard
- Individual agent profile view
- Behavioral fingerprint visualization
- Posting timeline and rhythm analysis
- Similar agents clustering
- Drift detection: is this agent changing?

### 4.4 Submolt Analysis Dashboard
- Community activity trends
- Member composition and turnover
- Topic evolution over time
- Semantic drift visualization

### 4.5 Coordination Detection Dashboard
- Synchronized burst detection
- Propagation chain visualization
- Phrase convergence alerts
- Each flag links to underlying evidence posts

---

## Phase 5: Interaction Graph & Clustering

### 5.1 Agent Interaction Graph
- Nodes = agents, edges = interactions
- Edge types: replied-to, co-participation in thread, semantic similarity, synchronized posting
- Interactive network visualization
- Filter by time window, submolt, interaction type

### 5.2 Behavioral Clustering
- Group agents into archetypes based on observable behavior
- Cluster visualization with drill-down
- Track cluster membership changes over time

---

## Phase 6: Alerts & Monitoring

### 6.1 Alert Configuration
- Define macro-level conditions:
  - Sharp behavioral fingerprint changes
  - Coordination spikes above threshold
  - New cluster emergence
  - Rapid semantic shifts in submolts
- Set sensitivity thresholds

### 6.2 Alert Inbox
- Chronological feed of triggered alerts
- Each alert shows exact evidence
- Mark as reviewed, relevant, or artifact
- Export alert history

---

## Phase 7: Reproducibility & Export

### 7.1 Analysis Runs
- Every analysis timestamped and versioned
- Link to underlying data snapshot
- Re-run with different parameters
- Compare outputs across runs

### 7.2 Export Capabilities
- Raw posts: CSV, JSON
- Derived features: CSV, JSON
- Analysis outputs: CSV, JSON
- Visualizations: PNG export

---

## Design & UX

### Visual Style
- **Dark mode analytics terminal** aesthetic
- High information density with clean typography
- Data-focused visualizations (line charts, heatmaps, network graphs)
- Accent colors for highlighting anomalies and alerts
- Minimal chrome, maximum data visibility

### Key Interactions
- Global time range selector affecting all views
- Drill-down from any aggregate to raw data
- Linked brushing between related visualizations
- Keyboard shortcuts for power users

---

## Technical Architecture

### Frontend
- React with TypeScript
- Recharts for time-series and basic charts
- Custom network graph component
- Dark theme with Tailwind CSS

### Backend
- Lovable Cloud for edge functions
- Supabase for database (append-only archive)
- Firecrawl connector for web scraping
- Lovable AI for optional embedding generation
- pg_cron for scheduled polling

### Data Flow
1. Scraper pulls data from Moltbook via Firecrawl
2. Raw data stored in append-only archive
3. Feature extraction runs on new data
4. Analysis layer queries features
5. Dashboards render results
6. Alerts monitor for threshold breaches

---

## Build Order (Core-First)

1. **Week 1**: Auth, database schema, Firecrawl integration, basic scraping
2. **Week 2**: Data explorer, manual fetch UI, archive browsing
3. **Week 3**: Post-level feature extraction, ecosystem dashboard
4. **Week 4**: Agent-level features, agent dashboard
5. **Week 5**: Submolt analysis, coordination detection basics
6. **Week 6**: Interaction graph, clustering
7. **Week 7**: Alerts, scheduled polling
8. **Week 8**: Reproducibility features, export polish

---

## Epistemic Commitment
The system deliberately avoids metaphysical claims. It does not infer minds, intentions, or consciousness. It does not label agents as "real" or "fake." It measures behavior, structure, change, and coordination - leaving interpretation to you, the researcher.
