'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Supabase & Contract Config
import { createClient } from '@/utils/supabase/client';
import { SK_LEDGE_ABI, CONTRACT_ADDRESS } from '@/lib/contractConfig';

// Dashboard UI Components (nasa ui/ folder)
import PageHeader from '@/components/dashboard/ui/PageHeader';
import { Card } from '@/components/dashboard/ui/Card';
import StatusBadge from '@/components/dashboard/ui/StatusBadge';

interface Vendor {
  company_name: string;
}

interface Bid {
  id: number;
  project_id: number;
  vendor_id: string;
  amount_php: number;
  timeline: string;
  notes?: string;
  proposal_url?: string;
  status: 'pending' | 'recommended' | 'won' | 'lost';
  created_at: string;
  vendors: Vendor;
}

interface Project {
  id: number;
  name: string;
  barangay?: string;
  status: string;
}

export default function BidsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const { address } = useAccount();

  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);

  const { data: isAuthorized } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SK_LEDGE_ABI,
    functionName: 'isAuthorizedOfficial',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: txHash, writeContract, isPending } = useWriteContract();
  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    checkAuthAndLoad();
  }, [projectId]);

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['SK_Chairperson', 'SK_Treasurer'].includes(profile.role)) {
  return router.push('/sk_dashboard/unauthorized');
}
setUserRole(profile.role);

    const { data: projData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (projData) setProject(projData as Project);

    const { data: bidsData } = await supabase
      .from('bids')
      .select(`
        *,
        vendors ( company_name )
      `)
      .eq('project_id', projectId)
      .order('amount_php', { ascending: true });
      
    if (bidsData) setBids(bidsData as unknown as Bid[]);
  };

  const handleStatusUpdate = async (bidId: number, newStatus: string) => {
    if (newStatus === 'recommended') {
      await supabase
        .from('bids')
        .update({ status: 'pending' })
        .eq('project_id', projectId)
        .eq('status', 'recommended');
    }

    await supabase.from('bids').update({ status: newStatus }).eq('id', bidId);
    checkAuthAndLoad();
  };

  const initiateAward = async (bid: Bid) => {
    if (!isAuthorized) {
      alert("Your connected wallet is not authorized as an SK Official.");
      return;
    }
    setSelectedBidId(bid.id);
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: 'addRecord',
      args: [
        project?.barangay || 'Barangay',
        BigInt(Math.floor(Number(bid.amount_php))),
        `Award: ${project?.name} to ${bid.vendors.company_name}`,
        'Award'
      ],
    });
  };

  useEffect(() => {
    if (isTxConfirmed && txHash && selectedBidId && project) {
      finalizeAwardInDb();
    }
  }, [isTxConfirmed, txHash]);

  const finalizeAwardInDb = async () => {
    const winningBid = bids.find(b => b.id === selectedBidId);
    if (!winningBid || !project) return;

    await supabase.from('projects').update({
      winning_bid_id: winningBid.id,
      winning_bidder_name: winningBid.vendors.company_name,
      award_tx_hash: txHash,
      status: 'Awarded'
    }).eq('id', project.id);

    await supabase.from('bids').update({ status: 'won' }).eq('id', winningBid.id);

    await supabase.from('bids')
      .update({ status: 'lost' })
      .eq('project_id', project.id)
      .neq('id', winningBid.id);

    setSelectedBidId(null);
    checkAuthAndLoad();
  };

  if (!project) return <div className="p-6">Loading bids...</div>;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title={`Bids for: ${project.name}`} />

      <div className="grid gap-4">
        {bids.map((bid) => (
          <Card key={bid.id} className="p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{bid.vendors?.company_name || 'Unknown Vendor'}</h3>
                <p className="text-lg text-gray-700">Bid Amount: ₱{Number(bid.amount_php).toLocaleString()}</p>
                <p className="text-sm mt-1">Timeline: {bid.timeline}</p>
                {bid.notes && <p className="text-sm italic text-gray-500">Notes: {bid.notes}</p>}
                {bid.proposal_url && (
                  <a href={bid.proposal_url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline block mt-2">
                    View Proposal Document
                  </a>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={bid.status} />
                <p className="text-xs text-gray-400">Submitted: {new Date(bid.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {project.status !== 'Awarded' && (
              <div className="mt-4 flex gap-3 border-t pt-3">
                {userRole === 'SK_Treasurer' && bid.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatusUpdate(bid.id, 'recommended')} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                      Recommend
                    </button>
                    <button onClick={() => handleStatusUpdate(bid.id, 'lost')} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                      Decline
                    </button>
                  </>
                )}

                {userRole === 'SK_Chairperson' && bid.status === 'recommended' && (
                  <button 
                    onClick={() => initiateAward(bid)} 
                    disabled={isPending}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPending && selectedBidId === bid.id ? 'Awaiting Signature...' : 'Award Winner'}
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
        {bids.length === 0 && <p className="text-gray-500">No bids submitted yet.</p>}
      </div>
    </div>
  );
}