# NCET Connect — Seed Data Inventory & Production Migration Plan

**Date:** November 14, 2026  
**Status:** Documented & Active  

---

## 1. Executive Summary

During MVP development, NCET Connect uses rich mock seed data in `src/data/seedData.ts` to power instant UI interactions, demonstration logins, and test fixtures without network latency.

This document inventories every seed data pathway in `useNcetStore.ts`, defines fallback policies for unauthenticated or offline users, and outlines the migration strategy to production Firestore collections.

---

## 2. Seed Data Entities & Storage Bindings

| Entity | Seed Source in `seedData.ts` | Local Storage Key (v3) | Firestore Target Collection | Production Fallback Behavior |
|--------|------------------------------|------------------------|-----------------------------|------------------------------|
| **Student Profile** | `DEFAULT_STUDENT_PROFILE` | `ncet_v3_profile` | `publicProfiles/{uid}` | If unauthenticated, uses demo profile. Once logged in via `@ncetmail.com`, fetches from Firestore. |
| **Opportunities** | `INITIAL_OPPORTUNITIES` | `ncet_v3_opportunities` | `opportunities` | Read-through cache. Seed acts as initial campus catalog if remote collection is empty. |
| **Applications** | `INITIAL_APPLICATIONS` | `ncet_v3_applications` | `applications` | Local-first. Seed items for demo user; newly applied items save to local storage + Firestore. |
| **Saved Items** | Seed array (Priya bookmarks) | `ncet_v3_saved` | `savedOpportunities` | Offline-first sync. Works fully offline. |
| **Campus Circles Peers** | `INITIAL_PEER_MATCHES` | `ncet_v3_circle_profiles` | `circleProfiles` | Public pseudonymous roster. Synced via real-time Firestore snapshot listener. |
| **Direct / Circle Messages** | `INITIAL_MESSAGES` | `ncet_v3_messages` | `messages` / `circleMessages` | Stored encrypted. Synced to Firestore subcollections on send. |
| **Community Posts & Polls** | `INITIAL_POSTS`, `INITIAL_POLLS` | `ncet_v3_posts`, `ncet_v3_polls` | `communityPosts`, `communityPolls` | Real-time listeners hydrate feed; seed data acts as cold-start initial content. |
| **Attendance Records** | `INITIAL_ATTENDANCE` | `ncet_v3_attendance` | `attendanceRecords` | Offline check-in queue. Synchronizes marked attendance to Firestore when network restores. |
| **Encrypted Vault Documents**| `INITIAL_VAULT_DOCS` | `ncet_v3_vault` | `vaultDocs` | Encrypted payload saved locally in indexed DB / localStorage and synced to Firestore. |
| **External Event Ingestion** | `INITIAL_EXTERNAL_EVENTS` | `ncet_v3_external_events` | `externalEventImports` | Admin-only ingestion queue. |

---

## 3. Migration Roadmap to Live Firestore

### Phase 0: Hybrid Fallback (Current)
- Seed data hydrates state if localStorage is empty and Firestore returns 0 documents.
- Any mutation (`apply`, `save`, `check-in`, `create post`) writes to localStorage and mirrors to Firestore if online.

### Phase 1: Authentication-Gated Fetch
- When an `@ncetmail.com` user signs in, load `publicProfiles/{uid}` and user-specific subcollections.
- Disable seed data fallback for authenticated non-demo accounts.

### Phase 2: Offline Mutation Queue
- Offline writes are recorded into `ncet_v3_offline_queue`.
- Service worker background sync drains queue on network reconnect.
