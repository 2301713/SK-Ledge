"use client";

import { useState, useEffect } from "react";
import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectButton() {
  const [componentMounted, setComponentMounted] = useState(false);

  // This forces the component to wait until it is safely running in the user's browser
  useEffect(() => {
    // ✅ Fixes the ESLint error by rendering the state update asynchronously
    const timer = setTimeout(() => {
      setComponentMounted(true);
    }, 0);

    // Clean up the timer if the component unmounts to prevent memory leaks
    return () => clearTimeout(timer);
  }, []);

  // 1. While the app is loading/rendering on the server, show a clean, disabled placeholder
  if (!componentMounted) {
    return (
      <div className="flex items-center justify-end p-4">
        <button
          disabled
          type="button"
          className="bg-slate-800/50 text-slate-500 font-semibold py-2 px-5 rounded-lg cursor-not-allowed border border-white/5 text-xs"
        >
          Loading Wallet...
        </button>
      </div>
    );
  }

  // 2. Once mounted safely on the client, render the fully functional custom button
  return (
    <div className="flex items-center justify-end p-4">
      <RainbowConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
        }) => {
          const connected =
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div>
              {(() => {
                // STATE 1: Wallet not connected
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                // STATE 2: Connected to the wrong network
                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all"
                    >
                      Wrong Network
                    </button>
                  );
                }

                // STATE 3: Successful connection
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-3.5 rounded-xl border border-white/10 transition-all"
                    >
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-white text-slate-900 text-xs font-bold py-2 px-4 rounded-xl hover:bg-slate-100 transition-all"
                    >
                      {account.displayName}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </RainbowConnectButton.Custom>
    </div>
  );
}
