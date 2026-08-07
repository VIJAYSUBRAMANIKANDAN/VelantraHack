# Velantra escrow contract

## Setup
```bash
cd blockchain
npm install
npx hardhat compile
```

## Deploy to Polygon Mumbai testnet
1. Fund your deployer wallet with test MATIC from a Mumbai faucet.
2. Set `WEB3_PROVIDER_URL` and `DEPLOYER_PRIVATE_KEY` in the root `.env`.
3. Run:
   ```bash
   npm run deploy:mumbai
   ```
4. Copy the printed contract address into `ESCROW_CONTRACT_ADDRESS` in `.env`.
5. Copy `artifacts/contracts/VelantraEscrow.sol/VelantraEscrow.json`'s `abi`
   field into `blockchain/abi/VelantraEscrow.json` (referenced by
   `app/routers/payments.py`).

## Note
This contract is unaudited and simplified for demonstration — `releasePayment`
and `refundPayment` trust the contract owner (the backend's deployer key) to
act correctly. A production version should verify delivery confirmation via
an oracle or multi-party signature before releasing funds.
