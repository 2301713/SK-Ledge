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
  AlertTriangle,
  ShieldCheck,
  XCircle,
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
import { canonicalizeBarangay } from '@/lib/batangasBarangays';
import {
  isAcceptingBids,
  projectDisplayStatus,
  PROJECT_STATUS,
} from '@/lib/projectApproval';
import ProjectApprovalModal from '@/components/projects/ProjectApprovalModal';
import Select from '@/components/ui/Select';
import AmountPreview from '@/components/AmountPreview';

interface Project {
  id: number;
  name: string;
  category: string;
  budget: number;
  status: string;
  location?: string;
  barangay?: string;
  is_open_for_bidding: boolean;
  bid_deadline?: string | null;
  winning_bid_id?: number | null;
  winning_bidder_name?: string | null;
  award_tx_hash?: string | null;
  approval_date?: string | null;
  approval_remarks?: string | null;
  rejection_date?: string | null;
  rejection_reason?: string | null;
  approval_document_id?: string | null;
  status_updated_at?: string | null;
  approver?: { full_name?: string | null } | null;
}

const inputClass =
  'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-3 text-sm font-bold text-primary-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    amount,
  );

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

export default function ProjectsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    budget: '',
    fiscal_year: String(new Date().getFullYear()),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [reviewProject, setReviewProject] = useState<Project | null>(null);

  const fetchProjects = async (assignedBarangay: string | null) => {
    // Projects are public for bidding, but this dashboard is barangay-scoped:
    // officials must only manage their own barangay's proposals.
    if (!assignedBarangay) {
      setProjects([]);
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*, approver:profiles!projects_approved_by_fkey(full_name)')
      .eq('barangay', assignedBarangay)
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
          // Project proposals, details, and bidding openness are owned by the
          // SK Chairperson. Financial controls belong to the SK Treasurer.
          if (profileData.role_type !== 'SK_Chairperson') {
            console.warn(
              'Unauthorized access: only the SK Chairperson can manage projects.',
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

          await fetchProjects(canonicalizeBarangay(profileData.barangay ?? ''));
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
    setFormError(null);

    const barangay = canonicalizeBarangay(currentUser?.barangay ?? '');
    if (!barangay) {
      setFormError(
        'Your profile must have a valid canonical barangay before creating a project.',
      );
      return;
    }

    // The category select is a custom listbox, so the browser form validation
    // that a native <select required> provided is enforced here instead.
    if (!formData.category) {
      setFormError('Select a project category.');
      return;
    }

    const { error } = await supabase.from('projects').insert([
      {
        name: formData.name,
        category: formData.category,
        budget: Number(formData.budget),
        fiscal_year: Number(formData.fiscal_year),
        status: 'Proposed',
        proposedBy: currentUser?.full_name,
        dateProposed: new Date().toISOString(),
        barangay,
        location: barangay,
        // Bidding is opened only after the SK Chairperson records approval.
        is_open_for_bidding: false,
        bid_deadline: null,
      },
    ]);

    if (!error) {
      setFormData({
        name: '',
        category: '',
        budget: '',
        fiscal_year: String(new Date().getFullYear()),
      });
      fetchProjects(barangay);
    } else {
      console.error(
        'Failed to create project:',
        JSON.stringify(error, null, 2),
      );
      setFormError(
        [
          `Failed to submit proposal: ${error.message}`,
          error.hint || error.details || '',
        ]
          .filter(Boolean)
          .join(' '),
      );
    }
  };

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);
  const openForBidding = projects.filter(isAcceptingBids).length;
  const awardedCount = projects.filter((p) => p.status === 'Awarded').length;

  if (isLoading) return <LogoLoader />;

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-4 bg-background p-4 selection:bg-tertiary selection:text-primary">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
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
                  <Select
                    leading
                    value={formData.category}
                    onChange={(category) =>
                      setFormData({ ...formData, category })
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
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                  Fiscal Year
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Calendar className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <Select
                    leading
                    value={formData.fiscal_year}
                    onChange={(fiscalYear) =>
                      setFormData({ ...formData, fiscal_year: fiscalYear })
                    }
                    required
                  >
                    {Array.from(
                      { length: 5 },
                      (_, index) => new Date().getFullYear() - index,
                    ).map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </Select>
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
                <AmountPreview value={formData.budget} />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-secondary-foreground">
                New proposals start as <strong>Proposed</strong>. Bidding
                controls stay disabled until the SK Chairperson records the
                official approval issued through the SK/Sangguniang Bayan
                process.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs font-medium text-danger"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{formError}</span>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="transition-all hover:shadow-[0_8px_30px_-12px_rgba(1,56,168,0.25)]"
            >
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold tracking-tight text-primary-foreground">
                    {project.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-secondary-foreground">
                    <span>{project.category}</span>
                    <span aria-hidden="true">•</span>
                    <span>{formatCurrency(project.budget || 0)}</span>
                    {project.location && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span className="break-words">{project.location}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={projectDisplayStatus(project)}
                      showDot
                    />
                    {isAcceptingBids(project) && project.bid_deadline && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pending/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-pending">
                        <Calendar className="h-3 w-3" />
                        Deadline: {formatDate(project.bid_deadline)}
                      </span>
                    )}
                  </div>

                  {project.status === PROJECT_STATUS.approved && (
                    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-secondary-foreground">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span>
                        Official approval recorded{' '}
                        {formatDate(project.approval_date)} by{' '}
                        {project.approver?.full_name || 'SK Chairperson'}.
                        {project.approval_remarks
                          ? ` ${project.approval_remarks}`
                          : ''}
                      </span>
                    </p>
                  )}

                  {project.status === PROJECT_STATUS.rejected && (
                    <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-danger">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        Rejected {formatDate(project.rejection_date)}:{' '}
                        {project.rejection_reason || 'No reason recorded.'}
                      </span>
                    </p>
                  )}

                  {project.status === PROJECT_STATUS.proposed && (
                    <p className="mt-3 text-[11px] leading-relaxed text-secondary-foreground">
                      Awaiting the SK Chairperson&apos;s official approval
                      record. Bidding stays disabled.
                    </p>
                  )}
                </div>

                {project.award_tx_hash && (
                  <div className="w-full rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-success">
                          Awarded On-Chain
                        </p>
                        <p className="mt-0.5 break-words text-sm font-bold text-primary-foreground">
                          {project.winning_bidder_name || 'N/A'}
                        </p>
                      </div>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${project.award_tx_hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View transaction
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
                {currentUser?.role_type === 'SK_Chairperson' &&
                  project.status !== PROJECT_STATUS.awarded &&
                  project.status !== PROJECT_STATUS.completed && (
                    <button
                      type="button"
                      onClick={() => setReviewProject(project)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-center text-sm font-bold text-primary-foreground transition-all hover:bg-secondary sm:w-auto"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {project.status === PROJECT_STATUS.proposed
                        ? 'Record Approval Decision'
                        : 'Approval Details'}
                    </button>
                  )}

                {(project.status === PROJECT_STATUS.approved ||
                  project.award_tx_hash) && (
                  <Link
                    href={`/sk_dashboard/bids/${project.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-center text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white sm:w-auto"
                  >
                    <Gavel className="h-4 w-4" />
                    View Bids
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
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

        {reviewProject && (
          <ProjectApprovalModal
            project={reviewProject}
            roleType={currentUser.role_type}
            approvalStatus={currentUser.approval_status}
            onClose={() => setReviewProject(null)}
            onUpdated={() =>
              fetchProjects(
                canonicalizeBarangay(currentUser.barangay ?? '') || null,
              )
            }
          />
        )}
      </main>
    </div>
  );
}