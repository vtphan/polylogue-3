# CrossCheck — Roadmap

Future improvements. None are blocking classroom deployment.

---

## Tier 4: Future Improvements

### 4.1 Scenario Ingestion from UI

**Problem:** Activities are imported via CLI only (`npx tsx scripts/ingest-registry.ts --all`).

**Solution:** Add a "Refresh activities" button for teachers or researchers to trigger ingestion from the browser.

---

### 4.2 SessionEvent Analysis

**Problem:** Events are logged to the `session_events` table (phase changes, scaffold sends, annotation creates) but never queried or displayed. Rich data for researchers.

**Solution:** Add event timeline to researcher session view and include in CSV export.

---

### 4.3 Scaffold Outcome Computation

**Problem:** The `outcome` field on scaffolds is nullable and never populated. Designed for post-session analysis correlating scaffold timestamps with subsequent annotation timestamps.

**Solution:** Post-session batch script to compute `annotations_after_5min`, `target_section_annotated`, `flaw_found_at_target`. Add to researcher scaffold export.

---

### 4.4 Mobile/Tablet Flaw Palette

**Problem:** The FlawPalette sidebar is `hidden lg:block`. Tablet users only have the bottom bar — no way to see the annotation list or delete annotations. No touch event handling for text selection.

**Solution:** Collapsible panel above the bottom bar on smaller screens. Add `onTouchEnd` handling for mobile text selection.

---

### 4.5 "Full" Practice Mode Completion

**Problem:** The schema has `severity` and `explanation` fields on annotations. The UI shows 3 practice modes but "Full" (severity + explanation) isn't fully wired.

**Solution:** Add severity dropdown and explanation textarea to the bottom bar in Full mode. Include severity accuracy in feedback comparison.

---

### 4.6 IndexedDB Offline Annotation Queue

**Problem:** If WiFi drops, annotations made during disconnection are lost (HTTP fetch fails). Socket.IO auto-reconnects but doesn't replay failed HTTP requests.

**Solution:** Store annotations in IndexedDB when fetch fails. Drain queue on reconnect. Server deduplicates by (groupId, userId, location, flawType).

**Status:** Deferred — Socket.IO auto-reconnection handles brief drops. Classroom WiFi is reliable enough for now.

---

### 4.7 Idle Detection on Teacher Dashboard

**Problem:** Connection status shows only active (connected) vs disconnected. No "connected but idle for N minutes" state.

**Solution:** Server tracks `lastActivity` timestamps. Dashboard shows yellow dot for idle groups (connected but no events in N minutes).

---

### 4.8 Legacy Mode Removal

**Problem:** The app supports both v1 modes (Recognize, Locate, Classify, Explain as independent teacher-selected modes) and v3 stages (three-stage sequential flow). Dual-path routing in `student/session/[id]/page.tsx`.

**Solution:** Migrate all legacy sessions, remove v1 mode types from `types.ts`, remove legacy routing branch, remove `scripts/migrate-classify-to-locate.ts`.
