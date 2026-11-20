# Security Specification — OBU Per Diem Management System

## 1. Data Invariants
1. **Identity Integrity**: Every `staff_accounts/{uid}` document must have `uid == request.auth.uid`, and every `travel_requests/{requestId}` document must have `employeeUid == request.auth.uid` on creation.
2. **No Self-Assigned Privileges**: Public self-registration in `staff_accounts/{uid}` is strictly constrained to `role == 'EMPLOYEE'` and `accountStatus == 'PENDING_APPROVAL'`, unless a matching `ACTIVE` invitation exists in `/account_invitations/{request.auth.token.email}` created by an Administrator.
3. **Immutable Audit Fields**: `createdAt`, `uid`, and `employeeUid` are immutable after creation; `createdAt == request.time` on creation and `updatedAt == request.time` on every write.
4. **Sequential Approval & Disbursement State Machine**:
   - Claims must start at `SUBMITTED_FOR_APPROVAL`.
   - Only an Administrator (`isAdmin()`) may transition `SUBMITTED_FOR_APPROVAL` -> `APPROVED_BY_ADMIN` or `REJECTED_BY_ADMIN`.
   - Only a Finance Officer (`isFinance()`) or Administrator (`isAdmin()`) may transition `APPROVED_BY_ADMIN` -> `COMPLETED` with `payment` details.
   - Once `COMPLETED`, travel claims are locked against client modification (except Admin override).
5. **PII Isolation**: Staff emails, phone numbers, and password hashes in `staff_accounts/{uid}` are readable only by the account owner (`uid == request.auth.uid`) or `isAdmin()`.
6. **Verified Auth Mandate**: All reads/writes require `request.auth != null && request.auth.token.email_verified == true`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: `getDoc('/travel_requests/req_1')` with `auth == null` -> DENIED.
2. **Unverified Email Write**: `setDoc('/staff_accounts/u1', ...)` with `email_verified == false` -> DENIED.
3. **Self-Assigned Admin Role**: Employee creates `/staff_accounts/{uid}` with `role: 'ADMINISTRATOR'` without an Admin invitation -> DENIED.
4. **Self-Activated Registration**: Employee creates `/staff_accounts/{uid}` with `accountStatus: 'ACTIVE'` without an Admin invitation -> DENIED.
5. **Self-Approval Update**: Employee updates `/staff_accounts/{uid}` changing `accountStatus` from `'PENDING_APPROVAL'` to `'ACTIVE'` -> DENIED.
6. **Shadow Ghost Field**: User includes `{ ..., isVerified: true }` in `staff_accounts` or `travel_requests` create/update -> DENIED (`hasOnly` check).
7. **Identity Spoofing on Claim**: User A creates `/travel_requests/req_spoof` with `employeeUid: 'user_B'` -> DENIED.
8. **State Shortcutting**: Employee creates `/travel_requests/req_fast` directly with `status: 'COMPLETED'` -> DENIED.
9. **Employee Self-Approving Claim**: Employee updates own claim from `SUBMITTED_FOR_APPROVAL` to `APPROVED_BY_ADMIN` -> DENIED.
10. **Cross-Employee PII Scrape**: Employee A runs `getDocs('/staff_accounts')` or `getDoc('/staff_accounts/user_B')` -> DENIED.
11. **Resource/ID Poisoning**: Creating `/travel_requests/` with a 200-char ID or invalid characters (`$foo/bar`) -> DENIED (`isValidId`).
12. **Client-Forged Timestamp / Value Poisoning**: Creating or updating a document with `createdAt: Timestamp(2020-01-01)` instead of `serverTimestamp()`, or passing non-number `daysCount` -> DENIED.
