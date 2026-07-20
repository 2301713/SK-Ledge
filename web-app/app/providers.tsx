'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// 1. Setup Wagmi Config with RainbowKit
// Note: Kumuha ng free projectId mula sa https://cloud.walletconnect.com
const config = getDefaultConfig({
  appName: 'SK-Ledge',
  projectId: '1a7d4b59e4397bf41c9173b2a705a94c', 
  chains: [mainnet, sepolia], // Using Sepolia for testing/development
  ssr: true, 
});

// 2. Initialize React Query Client
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}