'use client';

import { useState } from 'react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';

// Palitan ito ng totoong deployed SK-Ledge contract address mo
const CONTRACT_ADDRESS = '0xYourContractAddressHere';
const SK_LEDGE_ABI = [
  {
    type: 'function',
    name: 'submitRecord',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'purpose', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'recordType', type: 'string' },
    ],
  },
] as const;

export function RecordForm() {
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [recordType, setRecordType] = useState('Expense');
  const [formError, setFormError] = useState('');

  const { isConnected } = useAccount();
  const { 
    data: hash, 
    error: writeError, 
    isPending: isAwaitingWallet, 
    writeContract 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!purpose.trim()) return setFormError('Purpose is required.');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return setFormError('Please enter a valid positive amount.');
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SK_LEDGE_ABI,
        functionName: 'submitRecord',
        args: [purpose, parseEther(amount), recordType],
      });
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  const isProcessing = isAwaitingWallet || isConfirming;

  if (!isConnected) {
    return (
      <div className="p-6 text-center border rounded-md bg-gray-50">
        <p className="text-gray-600">Please connect your wallet to submit a record.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md p-6 space-y-4 border rounded-md shadow-sm">
      <h2 className="text-xl font-semibold">Log Financial Record</h2>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="purpose">Purpose</label>
        <input
          id="purpose"
          disabled={isProcessing}
          className="p-2 border rounded-md"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g., Council Meeting Snacks"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="amount">Amount (ETH)</label>
        <input
          id="amount"
          disabled={isProcessing}
          className="p-2 border rounded-md"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.05"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label className="text-sm font-medium" htmlFor="type">Type</label>
        <select
          id="type"
          disabled={isProcessing}
          className="p-2 border rounded-md bg-white"
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
        >
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      {writeError && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {writeError.message.includes('User rejected') 
            ? 'Transaction signature was rejected.' 
            : 'Error executing transaction. See console for details.'}
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full py-2 px-4 text-white font-medium rounded-md transition-colors ${
          isProcessing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isAwaitingWallet ? 'Awaiting Signature...' 
          : isConfirming ? 'Processing on Chain...' 
          : 'Submit Record'}
      </button>

      {isConfirmed && (
        <div className="p-3 mt-4 text-sm text-green-800 bg-green-100 rounded-md">
          Transaction successfully confirmed! 
          <a 
            href={`https://sepolia.etherscan.io/tx/${hash}`} 
            target="_blank" 
            rel="noreferrer"
            className="block mt-1 underline"
          >
            View on Block Explorer
          </a>
        </div>
      )}
    </form>
  );
}