export const SUI_NETWORK = "testnet";

export const DEEPBOOK_PREDICT = {
  serverUrl: "https://predict-server.testnet.mystenlabs.com",
  predictPackage:
    "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138",
  registry:
    "0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64",
  predictObject:
    "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a",
  dusdcType:
    "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
  dusdcCurrencyId:
    "0xf3000dff421833d4bb8ed58fac146d691a3aaba2785aa1989af65a7089ca3e9c",
  plpType:
    "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP",
} as const;

export const WALRUS = {
  publisherUrl: "https://publisher.walrus-testnet.walrus.space",
  aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space",
  uploadRelayUrl: "https://upload-relay.testnet.walrus.space",
  uploadStrategy: "Testnet publisher or @mysten/walrus SDK upload relay",
  defaultEpochs: 5,
  permanent: false,
} as const;

export const FACTORFI_PLACEHOLDERS = {
  packageId: import.meta.env.VITE_FACTORFI_PACKAGE_ID || "",
  poolObjectId: import.meta.env.VITE_FACTORFI_POOL_OBJECT_ID || "",
  quoteCoinType:
    import.meta.env.VITE_FACTORFI_QUOTE_COIN_TYPE || DEEPBOOK_PREDICT.dusdcType,
} as const;

export function hasFactorFiDeployment() {
  return Boolean(FACTORFI_PLACEHOLDERS.packageId);
}
