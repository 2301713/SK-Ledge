'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

export function ConnectButton() {
  return (
    <div className="flex items-center justify-end p-4">
      <RainbowConnectButton 
        showBalance={false} 
        accountStatus="avatar" 
        chainStatus="icon" 
      />
    </div>
  );
}