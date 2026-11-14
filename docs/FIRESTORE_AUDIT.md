# NCET Connect — Firestore Data Model & Security Audit

**Date:** November 14, 2026  
**Status:** Audited & Verified  
**Rules Version:** Cloud Firestore Security Rules v2  

---

## 1. Executive Summary

This document details the audit of Cloud Firestore collections, their corresponding TypeScript interfaces in `src/types/ncet.ts`, and validation logic in `firestore.rules`.

All writes enforce authenticated access, schema shape validation, bounded string and list lengths, and owner-only authorization constraints.

---

## 2. Collection Schema Matrix

| Firestore Collection | TypeScript Contract | Read Permission | Write / Create Permission | Update / Delete Permission |
|----------------------|---------------------|-----------------|---------------------------|----------------------------|
| `userAccounts` | `UserAccount` | Owner (`request.auth.uid == uid`) or Admin | Owner creating valid account schema | Owner or Admin |
| `publicProfiles` | `StudentProfile` | Authenticated students / faculty | Owner writing their profile (`uid`) | Owner only |
| `opportunities` | `Opportunity` | Public / Authenticated read | Organizers, Faculty, Admin | Authoring organizer or Admin |
| `applications` | `ApplicationRecord` / `OpportunityApplication` | Student applicant or target organizer | Applicant creating application | Applicant or Organizer updating status |
| `messages` | `DirectMessage` | Participant only (`senderId` or `recipientId`) | Sender only | Immutable (No update/delete) |
| `vaultDocs` | `EncryptedVaultDoc` | Owner only (`ownerId == request.auth.uid`) | Owner only (AES-GCM ciphertext) | Owner only |
| `notifications` | `NotificationItem` | Recipient only (`userId == request.auth.uid`) | System / Admin / Cloud Functions | Recipient (mark as read) |
| `engagementEvents` | `EngagementEvent` | Analytics service / Admin | Authenticated student (`userId`) | Append-only (No updates) |
| `communityPosts` | `CommunityPost` | Authenticated students / anonymous feed | Verified pseudonymous student | Author or Admin moderator |
| `communityPolls` | `CommunityPoll` | Authenticated students | Verified student / Organizer | Poll vote increment only |
| `circleProfiles` | `CircleProfile` | Authenticated students (Pseudonyms only) | Owner student | Owner student |
| `circleConnections` | `CircleConnection` | Sender or Receiver peer | Initiating student | Mutual participants |
| `circleMessages` | `CircleMessage` | Participants of active connection | Sender peer | Flag message (moderation) |
| `attendanceRecords` | `AttendanceRecord` | Student attendee or Event Organizer | Valid passcode match / Organizer desk | Verified organizer or Admin |
| `externalEventImports` | `ExternalEventImport` | Admin & Organizers | Admin or Ingestion Crawler | Admin approval / rejection |
| `communityReports` | `CommunityReport` | Admin moderators only | Any authenticated reporter | Admin resolution |
| `announcements` | `CampusAnnouncement` | Public campus read | Approved club organizers / Admin | Author or Admin |

---

## 3. Key Security Invariants Enforced

1. **Default Deny:**
   ```javascript
   match /{document=**} {
     allow read, write: if false;
   }
   ```
2. **Institutional Email Restriction:**
   Only accounts verified under the official domain `@ncetmail.com` are permitted to write student data.
3. **No Plaintext Vault Data:**
   `vaultDocs` schema strictly requires `ciphertext`, `iv`, and `docType`. Plaintext payload fields are rejected at the rule validator level.
4. **Decoupled Community Identity:**
   `circleProfiles` and `communityPosts` only accept `anonymousName` and `authorAliasName`. Institutional USN and email are disallowed in anonymous collections.
5. **Two-Way Mutual Consent:**
   `circleConnections.identityRevealed` remains `false` until both participants have signed an explicit disclosure handshake.
