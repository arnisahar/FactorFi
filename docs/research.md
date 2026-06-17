# FactorFi Research Notes

## Hackathon Fit

Primary track: DeFi & Payments.

Secondary sponsor relevance: DeepBook and Walrus.

Sui Overflow 2026 rewards polished UX, meaningful real-world applications, technical Sui integration, and long-term ecosystem potential. The local `hackathon.md` states judging weights of Product & UX 20%, Real-World Application 50%, Technical Implementation 20%, and Presentation & Vision 10%. Submission deadline is June 21, 2026 at 6:00 PM Pacific Time.

## Product Thesis

Invoice factoring is a strong fit because it is a real receivables financing workflow, not another crypto-collateral loop. The hackathon story should be:

1. Businesses need working capital before customers pay invoices.
2. Sui objects can represent invoice collection rights with explicit ownership and lifecycle state.
3. Walrus stores the private invoice document off-chain with verifiable blob references.
4. A DUSDC pool advances cash to the borrower and earns the financing fee.
5. DeepBook Predict can become a risk signal for whether a debtor pays by a due date.

## Official Technical Sources

- Sui dApp Kit: `@mysten/dapp-kit-react` and `@mysten/sui` are the current React path. The docs note that new projects should use the new dApp Kit packages instead of the legacy JSON-RPC-only package.
- Sui Move: Sui uses object-centric global storage. Smart contracts define and manage programmable Sui objects with globally unique IDs.
- Walrus SDK: `@mysten/walrus` can store and retrieve blobs on Walrus. Direct SDK writes can require many requests, while upload relays and publishers are better for app UX.
- Walrus HTTP API: public unauthenticated publishers are only for testnet. Mainnet requires an authenticated publisher, upload relay, or direct SDK usage.
- DeepBookV3: a fully on-chain CLOB with an SDK for integrations, balance managers, pools, orders, and swaps. It is not an end-user UI, so FactorFi should use it as infrastructure.
- DeepBook Predict: documented as a testnet integration target. It supports binary positions, vertical ranges, oracle-based pricing, PredictManager accounts, and vault liquidity.

## DeepBook Predict Testnet Constants

- Server: `https://predict-server.testnet.mystenlabs.com`
- Predict package: `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`
- Registry: `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64`
- Predict object: `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a`
- Quote asset: `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC`
- PLP coin: `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP`

## Key Risks

- Real invoice underwriting cannot be fully trustless in a hackathon. We should be explicit that the demo verifies document hash, borrower wallet, and lifecycle state, while production would need debtor confirmation, KYB, and payment rails.
- Walrus privacy requires a real encryption layer. Baseline demo can store PDFs on Walrus testnet; production path should add Seal or client-side encryption.
- DeepBook Predict contracts are provisional testnet targets. Use them for indexed market and risk-signal demonstration, but do not hardwire a mainnet promise.
- Sui CLI is installed and the Move package compiles/tests locally. Testnet publish is pending faucet gas for the local address.

## Walrus Testnet Endpoints

- Publisher: `https://publisher.walrus-testnet.walrus.space`
- Aggregator: `https://aggregator.walrus-testnet.walrus.space`
- Upload relay: `https://upload-relay.testnet.walrus.space`

## DeepBook Predict Test Tokens

The official DeepBook Predict docs state that builders request DUSDC and other test assets through the DeepBook Predict Testnet token request form: `https://tally.so/r/Xx102L`.
