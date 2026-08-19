'use client';

import LogoLoader from '@/components/LogoLoader';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FolderKanban,
  Tag,
  PhilippinePeso,
  Calendar,
  Wallet,
  CheckCircle2,
  Gavel,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import SideBar from '@/components/dashboard/SideBar';
import { supabase } from '@/lib/supabase';
import { UserAccount } from '@/lib/useAuthStore';
import { PROJECT_CATEGORIES } from '@/lib/dummyData';
import TopBar from '@/components/dashboard/ui/TopBar';
import PageHeader from '@/components/dashboard/ui/PageHeader';
import { Card, CardHeader } from '@/components/dashboard/ui/Card';
import StatCard from '@/components/dashboard/ui/StatCard';
import StatusBadge from '@/components/dashboard/ui/StatusBadge';

interface Project {
  id: number;
  name: string;
  category: string;
  budget: number;
  status: string;
  location?: string;
  is_open_for_bidding: boolean;
  bid_deadline?: string | null;
  winning_bid_id?: number | null;
  winning_bidder_name?: string | null;
  award_tx_hash?: string | null;
}

const inputClass =
  'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-3 text-sm font-bold text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    amount,
  );

export default function ProjectsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    budget: '',
    is_open_for_bidding: false,
    bid_deadline: '',
  });

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setProjects(data as Project[]);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('No active user session found.');
          router.push('/login');
          return;
        }

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

        if (profileData) {
          if (
            !['SK_Chairperson', 'SK_Treasurer'].includes(profileData.role_type)
          ) {
            console.warn(
              'Unauthorized access: Only SK officials can manage projects.',
            );
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

          await fetchProjects();
        }
      } catch (err) {
        console.error('Unexpected error loading profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert([
      {
        name: formData.name,
        category: formData.category,
        budget: Number(formData.budget),
        status: 'Proposed',
        proposedBy: currentUser?.full_name,
        dateProposed: new Date().toISOString(),
        location: currentUser?.barangay ?? null,
        is_open_for_bidding: formData.is_open_for_bidding,
        bid_deadline:
          formData.is_open_for_bidding && formData.bid_deadline
            ? formData.bid_deadline
            : null,
      },
    ]);

    if (!error) {
      setFormData({
        name: '',
        category: '',
        budget: '',
        is_open_for_bidding: false,
        bid_deadline: '',
      });
      fetchProjects();
    } else {
      console.error(
        'Failed to create project:',
        JSON.stringify(error, null, 2),
      );
      alert(
        `Failed to submit proposal: ${error.message}\n\n${error.hint || error.details || ''}`,
      );
    }
  };

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
  const openForBidding = projects.filter((p) => p.is_open_for_bidding).length;
  const awardedCount = projects.filter((p) => p.status === 'Awarded').length;

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
      <SideBar
        userName={currentUser.full_name}
        roleType={currentUser.role_type}
        barangay={currentUser.barangay}
      />

      <main className="min-w-0 flex-1 space-y-6 py-2 animate-fadein">
        <TopBar userName={currentUser.full_name} userEmail={currentUser.email} />

        <PageHeader
          eyebrow="SK Officials"
          title="Projects Management"
          subtitle="Manage and propose SK projects across your barangay."
        />

        {/* STAT ROW */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            label="Total Proposed Budget"
            value={formatCurrency(totalBudget)}
            icon={Wallet}
            variant="brand"
            trend={`${projects.length} total proposals`}
          />
          <StatCard
            label="Open for Bidding"
            value={openForBidding}
            icon={Gavel}
            trend="Projects accepting vendor bids"
          />
          <StatCard
            label="Awarded Projects"
            value={awardedCount}
            icon={CheckCircle2}
            trend={awardedCount > 0 ? 'On-chain award recorded' : 'No awards yet'}
          />
        </div>

        {/* CREATE PROJECT FORM */}
        <Card>
          <CardHeader
            eyebrow="New"
            title="Propose a New Project"
            subtitle="Submit a project proposal for your barangay."
          />

          <form onSubmit={handleCreateProject} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Project Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FolderKanban className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Livelihood Training Program"
                    className={inputClass}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Category
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Tag className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <select
                    className={inputClass}
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select category...
                    </option>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Budget (PHP)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <PhilippinePeso className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    className={inputClass}
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* BIDDING TOGGLE */}
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-primary-foreground">
                  Open for Bidding
                </p>
                <p className="text-xs text-secondary-foreground">
                  Allow vendors to submit bids for this project
                </p>
              </div>
              <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-secondary-foreground/20 transition-colors">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.is_open_for_bidding}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_open_for_bidding: e.target.checked,
                    })
                  }
                />
                <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition peer-checked:translate-x-5 peer-checked:bg-primary" />
              </span>
            </label>

            {formData.is_open_for_bidding && (
              <div className="space-y-2 animate-fadein">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Bid Deadline
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.bid_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, bid_deadline: e.target.value })
                    }
                    required={formData.is_open_for_bidding}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold tracking-wide text-white shadow-[0_6px_16px_-6px_rgba(1,56,168,0.5)] transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Submit Proposal
            </button>
          </form>
        </Card>

        {/* PROJECTS LIST */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="transition-all hover:shadow-[0_8px_30px_-12px_rgba(1,56,168,0.25)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight text-primary-foreground">
                    {project.name}
                  </h3>
                  <p className="mt-1 text-sm text-secondary-foreground">
                    {project.category} • {formatCurrency(project.budget || 0)}
                    {project.location ? ` • ${project.location}` : ''}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={project.status} showDot />
                    {project.is_open_for_bidding && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-information/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-information">
                        <Gavel className="h-3 w-3" />
                        Open for Bidding
                      </span>
                    )}
                    {project.is_open_for_bidding && project.bid_deadline && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pending/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pending">
                        <Calendar className="h-3 w-3" />
                        Deadline:{' '}
                        {new Date(project.bid_deadline).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' },
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {project.award_tx_hash && (
                  <div className="shrink-0 rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-success">
                      Awarded On-Chain
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-primary-foreground">
                      {project.winning_bidder_name || 'N/A'}
                    </p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${project.award_tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View transaction
                    </a>
                  </div>
                )}
              </div>

              {(project.is_open_for_bidding || project.winning_bid_id) && (
                <div className="mt-4 flex justify-end border-t border-border pt-4">
                  <Link
                    href={`/sk_dashboard/bids/${project.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <Gavel className="h-4 w-4" />
                    View Bids
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </Card>
          ))}

          {projects.length === 0 && (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <FolderKanban className="h-7 w-7 text-secondary-foreground" />
              </div>
              <p className="text-sm font-bold text-primary-foreground">
                No projects found
              </p>
              <p className="max-w-sm text-sm text-secondary-foreground">
                Propose your first project using the form above to get started.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}