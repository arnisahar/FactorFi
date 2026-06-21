import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { dAppKit } from "@/dApp-kit";
import DashboardPage from "@/pages/DashboardPage";

const queryClient = new QueryClient();

export default function WorkspaceRoute() {
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <DashboardPage />
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
