# NCET CONNECT — Firestore Security Specification

## 1. Data Invariants
1. **PII Isolation**: User emails and security preferences live exclusively in `/users/{userId}` and are readable only by the owning UID or verified admin. Non-PII networking attributes live in `/publicProfiles/{profileId}`.
2. **No Self-Assigned Admin**: Users may only set `role` to `'student'` or `'organizer'` during account registration; admin authority is derived exclusively from verified admin email or `/admins/{uid}`.
3. **Immutable Ownership & Temporal Integrity**: `uid`, `ownerId`, `studentId`, `senderId`, `organizerId`, and `createdAt` cannot be modified after creation. All `createdAt` and `updatedAt` timestamps must equal `request.time`.
4. **Relational Existence**: Creating an application record in `/applications/{applicationId}` requires that the referenced opportunity document exists in `/opportunities/{opportunityId}`.
5. **End-to-End Encrypted Vault & Messaging Isolation**: Vault documents (`/vaultDocs`) are strictly isolated to `ownerId == request.auth.uid`. Direct messages (`/messages`) are readable only when `request.auth.uid` is `senderId` or `recipientId`.
6. **Terminal State Locking**: Applications with `status == 'Completed'` cannot be modified by non-admin users.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: `POST /users/u1` with `{ role: "admin" }` -> `PERMISSION_DENIED` (enum restricts to `student` | `organizer`).
2. **Shadow Ghost Field Injection**: `POST /opportunities/opp1` adding `{ isFeaturedByPlatform: true }` -> `PERMISSION_DENIED` (`hasOnly()` blocks unknown keys).
3. **Unverified Email Spoofing**: Request with `email: "kmbhanucharanreddy@gmail.com"` and `email_verified: false` -> `PERMISSION_DENIED` (`isVerifiedUser()` mandates `email_verified == true`).
4. **PII Blanket Read**: Authenticated non-owner reading `/users/otherUid` -> `PERMISSION_DENIED`.
5. **Cross-User Application Spoof**: Creating `/applications/app1` with `studentId: "victimUid"` -> `PERMISSION_DENIED`.
6. **Orphaned Application Write**: Creating `/applications/app1` referencing non-existent `opportunityId: "fake999"` -> `PERMISSION_DENIED` (`exists()` fails).
7. **Timestamp Forgery**: Creating `/opportunities/opp1` with backdated `createdAt: "2020-01-01T00:00:00Z"` -> `PERMISSION_DENIED` (`createdAt == request.time`).
8. **ID Poisoning**: Creating `/vaultDocs/` with 500-char ID or invalid characters `../etc/passwd` -> `PERMISSION_DENIED` (`isValidId()` regex + length <= 128).
9. **Value Poisoning on Update**: Updating `/applications/app1` with `status: 12345` or 1MB `notes` string -> `PERMISSION_DENIED` (`isValidApplication()` enforces string & size limits).
10. **Terminal State Mutation**: Student updating `/applications/app1` after `status == 'Completed'` -> `PERMISSION_DENIED`.
11. **Vault Eavesdropping**: Listing `/vaultDocs` without `where("ownerId", "==", uid)` or as another user -> `PERMISSION_DENIED`.
12. **Message Interception**: Reading `/messages/m1` where `auth.uid` is neither `senderId` nor `recipientId` -> `PERMISSION_DENIED`.
