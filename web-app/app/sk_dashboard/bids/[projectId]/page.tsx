'use client';

import LogoLoader from '@/components/LogoLoader';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Gavel,
  Loader2,
  ShieldCheck,
  Trophy,
  Wallet,
} from 'lucide-react';

import SideBar from '@/components/dashboard/SideBar';
import { supabase } from '@/lib/supabase';
import { UserAccount } from '@/lib/useAuthStore';
import { SK_LEDGE_ABI, CONTRACT_ADDRESS } from '@/lib/contractConfig';
import { syncRecord } from '@/lib/syncRecord';
import TopBar from '@/components/dashboard/ui/TopBar';
import PageHeader from '@/components/dashboard/ui/PageHeader';
import { Card } from '@/components/dashboard/ui/Card';
import StatCard from '@/components/dashboard/ui/StatCard';
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
  location?: string;
  status: string;
  award_tx_hash?: string | null;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    amount,
  );

export default function BidsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const { address } = useAccount();

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const loadBids = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(
            'id, username, full_name, role_type, barangay, email, approval_status',
          )
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError.message);
          return;
        }

        if (
          !profileData ||
          !['SK_Chairperson', 'SK_Treasurer'].includes(profileData.role_type)
        ) {
          router.push('/unauthorized');
          return;
        }

        setCurrentUser({
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name || profileData.username,
          role_type: profileData.role_type,
          barangay: profileData.barangay || 'No Barangay Assigned',
          email: profileData.email,
          approval_status: profileData.approval_status,
        });
        setUserRole(profileData.role_type);

        await loadBids();
      } catch (err) {
        console.error('Unexpected error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [loadBids, router]);

  const handleStatusUpdate = async (bidId: number, newStatus: string) => {
    if (newStatus === 'recommended') {
      await supabase
        .from('bids')
        .update({ status: 'pending' })
        .eq('project_id', projectId)
        .eq('status', 'recommended');
    }

    await supabase.from('bids').update({ status: newStatus }).eq('id', bidId);
    await loadBids();
  };

  const initiateAward = async (bid: Bid) => {
    if (!isAuthorized) {
      alert('Your connected wallet is not authorized as an SK Official.');
      return;
    }
    setSelectedBidId(bid.id);

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SK_LEDGE_ABI,
      functionName: 'addRecord',
      args: [
        project?.location || 'Barangay',
        BigInt(Math.round(Number(bid.amount_php) * 100)),
        `Award: ${project?.name} to ${bid.vendors.company_name}`,
        'Award',
      ],
    });
  };

  useEffect(() => {
    if (!isTxConfirmed || !txHash || !selectedBidId || !project) return;

    const finalizeAwardInDb = async () => {
      const winningBid = bids.find((b) => b.id === selectedBidId);
      if (!winningBid || !project) return;

      await supabase
        .from('projects')
        .update({
          winning_bid_id: winningBid.id,
          winning_bidder_name: winningBid.vendors.company_name,
          award_tx_hash: txHash,
          status: 'Awarded',
        })
        .eq('id', project.id);

      await supabase
        .from('bids')
        .update({ status: 'won' })
        .eq('id', winningBid.id);

      await supabase
        .from('bids')
        .update({ status: 'lost' })
        .eq('project_id', project.id)
        .neq('id', winningBid.id);

      await syncRecord({
        type: 'award',
        user_id: currentUser?.id ?? '',
        blockchain_tx_hash: txHash,
        contract_address: CONTRACT_ADDRESS,
        official_address: address ?? '',
        barangay: project.location || 'Barangay',
        amount: Math.round(Number(winningBid.amount_php) * 100),
        purpose: `Award: ${project?.name} to ${winningBid.vendors.company_name}`,
        project_id: String(project.id),
      }).catch((err) => console.error('Failed to sync award record:', err));

      setSelectedBidId(null);
      await loadBids();
    };

    finalizeAwardInDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bids, isTxConfirmed, loadBids, project, selectedBidId, txHash]);

  const lowestBid = bids.length
    ? Math.min(...bids.map((b) => Number(b.amount_php)))
    : 0;
  const recommendedCount = bids.filter((b) => b.status === 'recommended').length;

  if (isLoading) return <LogoLoader />;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      {currentUser && (
        <SideBar
          userName={currentUser.full_name}
          roleType={currentUser.role_type}
          barangay={currentUser.barangay}
        />
      )}

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar
          userName={currentUser?.full_name ?? 'SK Official'}
          userEmail={currentUser?.email}
          hideSearch
        />

        <div className="flex items-start justify-between gap-4">
          <PageHeader
            eyebrow="Bids & Awards"
            title={project ? `Bids for: ${project.name}` : 'Bids'}
            subtitle={
              project
                ? `Review vendor bids${project.location ? ` for ${project.location}` : ''} and manage the award process.`
                : 'Loading project details...'
            }
          />
          <Link
            href="/sk_dashboard/projects"
            className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-all hover:border-primary/30 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>

        {project ? (
          <>
            {/* WALLET AUTH STATUS */}
            {userRole === 'SK_Chairperson' && (
              <div
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                  isAuthorized
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-danger/30 bg-danger/10 text-danger'
                }`}
              >
                {isAuthorized ? (
                  <>
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-bold">
                      Your connected wallet is authorized to award bids
                      on-chain.
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-bold">
                      Connect an authorized SK Official wallet to award bids
                      on-chain.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* STAT ROW */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard
                label="Total Bids"
                value={bids.length}
                icon={Gavel}
                variant="brand"
                trend="Vendor submissions received"
              />
              <StatCard
                label="Lowest Bid"
                value={lowestBid ? formatCurrency(lowestBid) : '—'}
                icon={Wallet}
                trend="Most cost-efficient proposal"
              />
              <StatCard
                label="Recommended"
                value={recommendedCount}
                icon={Trophy}
                trend={
                  recommendedCount > 0
                    ? 'Awaiting chairperson award'
                    : 'No bids recommended yet'
                }
              />
            </div>

            {/* BIDS LIST */}
            {bids.length > 0 ? (
              <div className="grid gap-4">
                {bids.map((bid) => (
                  <Card
                    key={bid.id}
                    className={`transition-all hover:shadow-[0_8px_30px_-12px_rgba(1,56,168,0.25)] ${
                      bid.status === 'won'
                        ? 'border-success/40'
                        : bid.status === 'lost'
                          ? 'opacity-60'
                          : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                            <Building2 className="h-5 w-5 text-secondary-foreground" />
                          </div>
                          <h3 className="text-lg font-bold tracking-tight text-primary-foreground">
                            {bid.vendors?.company_name || 'Unknown Vendor'}
                          </h3>
                          {bid.status === 'won' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
                              <Trophy className="h-3 w-3" />
                              Winner
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-3xl font-bold tracking-tight text-primary-foreground">
                          {formatCurrency(Number(bid.amount_php))}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-secondary-foreground">
                          {bid.timeline && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              Timeline: {bid.timeline}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            Submitted{' '}
                            {new Date(bid.created_at).toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric', year: 'numeric' },
                            )}
                          </span>
                        </div>

                        {bid.notes && (
                          <p className="mt-3 rounded-xl bg-secondary/40 px-3 py-2 text-sm italic text-secondary-foreground">
                            {bid.notes}
                          </p>
                        )}

                        {bid.proposal_url && (
                          <a
                            href={bid.proposal_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                          >
                            <FileText className="h-4 w-4" />
                            View Proposal Document
                          </a>
                        )}
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <StatusBadge status={bid.status} showDot />
                      </div>
                    </div>

                    {/* ACTIONS */}
                    {project.status !== 'Awarded' &&
                      userRole === 'SK_Treasurer' &&
                      bid.status === 'pending' && (
                        <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
                          <button
                            onClick={() =>
                              handleStatusUpdate(bid.id, 'recommended')
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-pending px-4 py-2 text-xs font-bold tracking-wide text-white transition-all hover:bg-pending/90 active:scale-95"
                          >
                            <Trophy className="h-4 w-4" />
                            Recommend
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(bid.id, 'lost')}
                            className="inline-flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-xs font-bold tracking-wide text-danger transition-all hover:bg-danger/5 active:scale-95"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                    {project.status !== 'Awarded' &&
                      userRole === 'SK_Chairperson' &&
                      bid.status === 'recommended' && (
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                          <button
                            onClick={() => initiateAward(bid)}
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-xs font-bold tracking-wide text-white transition-all hover:bg-success/90 active:scale-95 disabled:opacity-50"
                          >
                            {isPending && selectedBidId === bid.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Awaiting Signature...
                              </>
                            ) : (
                              <>
                                <Trophy className="h-4 w-4" />
                                Award Winner
                              </>
                            )}
                          </button>
                          <p className="text-xs text-secondary-foreground">
                            This will record the award on the Sepolia ledger
                            before finalizing.
                          </p>
                        </div>
                      )}

                    {bid.status === 'won' && project.award_tx_hash && (
                      <div className="mt-4 border-t border-border pt-4">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${project.award_tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-xs font-bold text-success transition-all hover:bg-success/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Award recorded on-chain — View transaction
                        </a>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Gavel className="h-7 w-7 text-secondary-foreground" />
                </div>
                <p className="text-sm font-bold text-primary-foreground">
                  No bids submitted yet
                </p>
                <p className="max-w-sm text-sm text-secondary-foreground">
                  Bids will appear here once vendors submit proposals for this
                  project.
                </p>
              </Card>
            )}
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <FileText className="h-7 w-7 text-secondary-foreground" />
            </div>
            <p className="text-sm font-bold text-primary-foreground">
              Project not found
            </p>
            <Link
              href="/sk_dashboard/projects"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}