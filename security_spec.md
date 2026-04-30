# Security Specification for Office Master

## Data Invariants
- A user document must exist for every authenticated user.
- XP must be a non-negative number.
- `survivalManualUnlocked` defaults to false.
- A `turma` must have a valid `instructorId`.

## The "Dirty Dozen" Payloads
1. **Identity Theft**: User A tries to write to `/users/userB`.
2. **Stat Spoofing**: User tries to set their XP to 999999 without earning it (difficult to prevent client-side XP updates in Firestore alone without a backend, but we validate types and sizes).
3. **Role Escalation**: Student tries to change their `role` to `instructor`.
4. **Chat Hijacking**: User A tries to read `/users/userB/chats`.
5. **Turma Code Injection**: User tries to create a `turma` with a 1MB string as a name.
6. **Orphaned Chats**: Creating a chat message for a user that doesn't exist.
7. **Member List Poisoning**: Adding 10,000 members to a `turma` array (we should use a subcollection for members if unbounded, but for a "class" maybe we limit it).
8. **Unauthorized Turma Edit**: User B (not instructor) tries to change the `name` of User A's `turma`.
9. **Time Travel**: Setting `createdAt` to 10 years ago.
10. **ID Poisoning**: Creating a user with a document ID that is a huge string.
11. **Shadow Fields**: Adding `isGlobalAdmin: true` to a user profile.
12. **PII Leak**: Publicly listing all users' emails.

## Test Runner (Draft)
The `firestore.rules.test.ts` would verify that these operations result in PERMISSION_DENIED.

---

# Draft Firestore Rules

I will now write the rules to a draft file.
