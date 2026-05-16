# Security Specification - Catetkas

## Data Invariants
1. All data (products, transactions, customers) MUST belong to a `userId` matching the authenticated user's UID.
2. A user can only read and write data where `userId == request.auth.uid`.
3. Inventory `stock` cannot be modified by users skip during valid transaction flows (handled by rules or server logic, but here we use client side updates for simplicity, so we need strict controls).
4. `createdAt` fields are immutable.
5. Users cannot change their own `role` once set (admin/staff).

## The Dirty Dozen Payloads
1. (Identity) Create product with another user's `userId`.
2. (Identity) Update product's `userId` to someone else.
3. (Identity) Delete product owned by someone else.
4. (Integrity) Create transaction with negative `totalAmount`.
5. (Integrity) Set product `stock` to a string.
6. (Integrity) Update `createdAt` of a transaction.
7. (State) Bypass `staff` restrictions (if any).
8. (Poisoning) Inject 1MB string into product name.
9. (Poisoning) Use invalid characters in document IDs.
10. (Access) List transactions without being signed in.
11. (Access) List all customers in the system (query scrubbing).
12. (Relational) Create transaction for a non-existent customer (orphaned records).

## Test Runner (Logic Verification)
A `firestore.rules.test.ts` would verify these, but here I will focus on writing the "Fortress" rules directly and then deploying them.
