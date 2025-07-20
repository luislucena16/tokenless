# Tokenless

**Private, Compliant Asset Tokenization on Midnight — No Public Tokens, Full Privacy**

---

## 📌 Overview

Tokenless is a natively Midnight-based asset tokenization system. It enables secure, verifiable, and private representation of investments and participations on-chain—without issuing public or transferable tokens. Zero-knowledge proofs (ZKPs) guarantee user privacy and regulatory compliance, preventing public exposure of balances, identities, or investment patterns.

---

## 🚀 Key Features

- **No public tokens:** No transferable tokens or public balance lists.
- **Privacy by design:** All actions (investment, project creation, withdrawals) are protected by ZKPs.
- **Regulatory compliance:** Supports zk-credentials for KYC, AML, and residency without exposing sensitive data.
- **On-chain verifiability:** All investments and actions are cryptographically auditable and provable.
- **Modular architecture:** Decoupled smart contracts, API, and UI, with privacy logic at every layer.
- **Censorship resistance:** No central points of control or participant exposure.
- **Refunds and flexible management:** Integrated refund mechanisms and project administration.

---

## 🛠️ Installation & Setup

### 1. Clone the repository

```sh
git clone https://github.com/luislucena16/tokenless.git
cd tokenless
```

### 2. Verify Node.js version

```sh
node -v
# Must be >= 22
```

### 3. Install dependencies

```sh
yarn install
```

### 4. Build all packages

```sh
yarn build:all
```
> _This command builds all workspaces: `packages/contract`, `packages/api`, `packages/cli`, and `packages/ui`._

### 3. Download and Prepare ZK Parameters (Required for Proofs)

After building, you need to fetch the zero-knowledge (ZK) parameters required by the proof server. This is done via a helper script that you should place in the CLI package:

```bash
# Move to the CLI package directory
cd packages/cli

# Download the fetch-zk-params.sh script
curl -O https://raw.githubusercontent.com/bricktowers/midnight-proof-server/main/fetch-zk-params.sh
# or
wget https://raw.githubusercontent.com/bricktowers/midnight-proof-server/main/fetch-zk-params.sh

# Give execution permissions
chmod +x fetch-zk-params.sh

# Run the script to download ZK parameters
./fetch-zk-params.sh
```

> **Note:**
> - This script will generate a folder at `/.cache/midnight/zk-params` with all the required parameters for zero-knowledge proofs.
> - **Why is this needed?** If you see an error like:
>   `Error in response: Proving(public parameters for k=16 not found in cache)`
>   it means the required parameters are missing.
> - **This script is a workaround** to ensure your application works locally. The Midnight team is working on a more integrated solution for parameter management in the future.

### 6. Launch Midnight infrastructure (TestNet)

```sh
docker compose -f testnet.yml up -d
```
> _The `-d` flag runs containers in the background. You should see output like:_
> ```
>  ✔ Container tokenless-node          Started
>  ✔ Container tokenless-proof-server  Started
>  ✔ Container tokenless-indexer       Started
> ```

### 7. Configure and launch the UI

#### 7.1 Environment variables

Create a `.env` file in `packages/ui` with:

```
VITE_NETWORK_ID=TestNet
VITE_LOGGING_LEVEL=trace
```

#### 7.2 Build and start

```sh
npx turbo run build
yarn start
```

Go to [http://localhost:8080](http://localhost:8080).

---

## 💡 How It Works

1. **User connects their wallet** (Lace Midnight-compatible).
2. **Frontend initializes providers** and connects to the contract (deploy or join).
3. **Investments and actions** are performed using zero-knowledge proofs, never exposing sensitive data.
4. **Contract state** (projects, balances, etc.) is queried and updated in real time using observables.
5. **The UI never accesses or displays private data:** everything is managed via ZKPs and controlled access logic.

---

## 🔒 Privacy & Compliance

- **ZKPs for every interaction:** All operations require zero-knowledge proofs.
- **No public balances:** No transferable tokens or investor lists.
- **Demonstrable compliance:** Users can invest and withdraw without disclosing their data.
- **No pattern exposure:** Neither amount nor frequency of investment is public.

---

## 🧪 Development Commands

- **Install dependencies:** `yarn install`
- **Build all:** `yarn build:all`
- **Download ZK params (one-liner):**
  ```sh
  cd packages/cli && \
  curl -O https://raw.githubusercontent.com/bricktowers/midnight-proof-server/main/fetch-zk-params.sh && \
  chmod +x fetch-zk-params.sh && \
  ./fetch-zk-params.sh
  ```
- **Launch infrastructure:** `docker compose -f testnet.yml up -d`
- **Build UI:** `npx turbo run build`
- **Start UI:** `yarn start`

---

## 📂 Project Structure

```
tokenless/
  packages/
    contract/   # Smart contracts (Compact)
    api/        # API and integration logic
    cli/        # Infrastructure and scripts
    ui/         # React + Vite frontend
```

---

## 🧱 Tech Stack

- **Midnight Network** (blockchain & ZKPs)
- **Compact** (smart contract language)
- **React + Vite** (frontend)
- **Yarn + TurboRepo** (monorepo & dependencies)
- **Docker** (local/testnet infrastructure)
- **Pino** (logging)
- **RxJS** (API observables)

---

## 🤝 Contributing

### Contribution Guidelines

This repository is meant to be forked as a starting point for new developments. You can:

1. **Fork** the repository for your own project
2. **Contribute** - Any PR is welcome to improve the template

If contributing:
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Use **TypeScript** for all code
- Follow configured **ESLint** and **Prettier**
- Write **tests** for new features
- Document **APIs** and complex functions

### Commit Structure

```
feat: new feature
fix: bug fix
docs: documentation
style: code formatting
refactor: refactoring
test: tests
chore: maintenance tasks
```

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap

- [ ] Advanced zk-credential integration for compliance with KYC
- [ ] Improved UI/UX for private onboarding
- [ ] Add new Investor and Issuer sections (portfolio, tx history, properties invested, dashboard)
- [ ] Support for more wallets
- [ ] Contract audit and security testing
- [ ] Extended documentation and integration examples
- [ ] Support for multiple credential issuers
- [ ] zk-credential revocation system
- [ ] Real-time ROI tracking with privacy-preserving data
- [ ] Private messaging between investor and issuer
- [ ] Developer SDK with ZK templates
- [ ] Monitoring & analytics with privacy focus
- [ ] Secondary market controls for issuers
- [ ] Issuer notifications and compliance alerts

## 🆘 Support

If you have issues or questions:

1. Check the [documentation](docs/)
2. Search [existing issues](../../issues)
3. Create a [new issue](../../issues/new)

## 🔗 Useful Links

- [Midnight Network Documentation](https://docs.midnight.network/)
- [Compact Language Guide](https://docs.midnight.network/develop/reference/compact/)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

**⭐ If this template is useful to you, consider giving the repository a star!**

---

**Made with ❤️ by the Midnight ecosystem**