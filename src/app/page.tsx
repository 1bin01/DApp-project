'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { hardhat } from '@wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import WalletConnect from '@/components/WalletConnect';
import GameList from '@/components/GameList';

const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

const queryClient = new QueryClient();

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <main className="min-h-screen bg-slate-100">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-end mb-8">
              <WalletConnect />
            </div>
            <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">BAY 밸런스 게임</h1>
            <GameList />
          </div>
        </main>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
