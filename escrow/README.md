# Escrow Contract

**Escrow System on Midnight Network**

## Quick Start

### 1. Install Dependencies

```sh
cd escrow
yarn install
```

### 2. Fetch ZK Parameters

```sh
cd packages/cli
./fetch-zk-params.sh
```

This downloads all required ZK parameters (k=10 to k=17) to `packages/.cache/midnight/zk-params/`.

### 3. Build All Packages

```sh
cd ../..
yarn build:all
```

This compiles the contract, builds the API, and builds the UI.

### 4. Configure Environment Variables

```sh
cd packages/ui
echo "VITE_NETWORK_ID=TestNet
VITE_LOGGING_LEVEL=trace" > .env
```

### 5. Prepare ZK Keys for UI

```sh
yarn predev
```

### 6. Start Infrastructure (in a separate terminal)

```sh
cd packages/cli
docker compose -f testnet.yml up
```

### 7. Start Development Server

```sh
cd packages/ui
yarn start
```

Open `http://localhost:8080` in your browser.

## Project Structure

```
escrow/
  packages/
    contract/   # Escrow Compact contract
    api/        # API layer
    ui/         # React frontend
    cli/        # Infrastructure scripts
  compact/      # Compact compiler
```

## Notes

- Contributor addresses must be `ZswapCoinPublicKey` format (32 bytes, hex string)
- The contract uses an empty private state
- Treasury is managed using `QualifiedCoinInfo`
- Contract address already deployed on TestNet: `020027a770b658fc040c3435fdf5f59b90c2b3430911d76ef52cd0017a087b8c7984`
