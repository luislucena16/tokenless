# Tokenless Smart Contract

**Confidential, Compliant Asset Tokenization on Midnight — No Public Tokens, Full Privacy**

---

## 📌 Overview

Tokenless enables users to launch investment projects and accept privacy-preserving investments using zero-knowledge proofs and cryptographic commitment schemes. No public tokens are issued or exchanged—participation is cryptographically verifiable and private. The contract is written in Compact for the Midnight blockchain.

---

## 🚀 Key Features

- **Project creation and management** with flexible goals and durations
- **Private investments** using commitment schemes and ZKPs
- **Automated fund management** and secure withdrawals for project owners
- **Refund system** for investors, with privacy guarantees
- **No public tokens:** All participation is off-chain and private by design

---

## 🛠️ Main Functions

### Project Management

- `createProject()` — Create a new project with investment goal and duration
- `cancelProject()` — Delete a project (owner only)
- `endProject()` — Close a project without withdrawal (owner only)
- `updateProject()` — Modify investment goal and duration (owner only)
- `withdrawProjectFunds()` — Withdraw funds when goal is met (owner only)

### Investor Functions

- `investProject()` — Invest tokens in an active project
- `requestRefund()` — Request refund from a project (verified investors only)

---

## 💡 Data Structures

```ts
Project {
    id, title, description, owner,
    investmentGoal, raised, investors,
    duration, creationDate, status,
    coinType
}
```
**Status:** `active` | `withdrawn` | `closed`

**Investor:**
```ts
struct Investor {
    id: Bytes<32>,           // Investor identifier  
    investment: Uint<32>,    // Amount invested
    coinType: Bytes<32>      // Token type invested
}
```

---

## 🔄 Usage Flow

1. **Create project:** Owner calls `createProject()`
2. **Invest:** Investors call `investProject()` (private, via ZKP)
3. **Withdraw:** Owner calls `withdrawProjectFunds()` when goal is met
4. **Refund:** Investors can call `requestRefund()` if needed

---

## 🧩 Custom Library Functions

- **`generateOwnersPK(address, sk, rand)`**  
  Generates a cryptographic hash for project owner verification using address, secret key, and project ID.

- **`generateCommit(data, rand)`**  
  Creates a privacy-preserving commitment for investor data to enable anonymous investments.

---

## 🔒 Offchain Witness Interaction

The contract utilizes witness functions to retrieve offchain private state and enable privacy-preserving logic:

```ts
// Generate offchain secret key for ID or commitment generation
witness local_secret_key(): Bytes<32>;

// Check if a project is expired or still valid
witness confirm_project_expiration(duration: Uint<128>, startDate: Uint<128>): Boolean;

// Generate ZK proof for an investor to show they have invested in at least one project
witness findInvestor(commitment: Bytes<32>): MerkleTreePath<100, Bytes<32>>;
```

---

## 📂 File Structure

```
contract/
  src/
    tokenless.compact         # Main contract source
    CustomLibrary.compact     # Custom cryptographic helpers
    managed/                  # Generated contract bindings
  README.md                   # This file
```

---

**Made with ❤️ by the Midnight ecosystem**