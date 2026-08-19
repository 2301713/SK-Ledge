'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { createClient } from '@/utils/supabase/client';
import TopBar from '@/components/dashboard/ui/TopBar';
import PageHeader from '@/components/dashboard/ui/PageHeader';
import { Card } from '@/components/dashboard/ui/Card';
import StatusBadge from '@/components/dashboard/ui/StatusBadge';

interface Project {
  id: number;
  name: string;
  category: string;
  budget: number;
  status: string;
  is_open_for_bidding: boolean;
  bid_deadline?: string | null;
  winning_bid_id?: number | null;
  winning_bidder_name?: string | null;
  award_tx_hash?: string | null;
}

export default function ProjectsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState<string>('SK Official');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    budget: '',
    is_open_for_bidding: false,
    bid_deadline: '',
  });

  useEffect(() => {
    fetchUserData();
    fetchProjects();
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setProjects(data as Project[]);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert([
      {
        name: formData.name,
        category: formData.category,
        budget: Number(formData.budget),
        status: 'Proposed',
        is_open_for_bidding: formData.is_open_for_bidding,
        bid_deadline: formData.is_open_for_bidding && formData.bid_deadline ? formData.bid_deadline : null,
      },
    ]);

    if (!error) {
      setFormData({ name: '', category: '', budget: '', is_open_for_bidding: false, bid_deadline: '' });
      fetchProjects();
    } else {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <TopBar userName={userName} />
      <PageHeader title="Projects Management" />

      {/* Create Project Form */}
      <Card className="p-4">
        <h2 className="text-lg font-bold mb-4">Propose a New Project</h2>
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Project Name" 
            className="border p-2 rounded" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            required 
          />
          <input 
            type="text" 
            placeholder="Category" 
            className="border p-2 rounded" 
            value={formData.category} 
            onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
            required 
          />
          <input 
            type="number" 
            placeholder="Budget (PHP)" 
            className="border p-2 rounded" 
            value={formData.budget} 
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })} 
            required 
          />
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.is_open_for_bidding} 
              onChange={(e) => setFormData({ ...formData, is_open_for_bidding: e.target.checked })} 
            />
            <span className="text-sm font-medium">Open for Bidding</span>
          </label>

          {formData.is_open_for_bidding && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bid Deadline</label>
              <input 
                type="date" 
                className="border p-2 rounded w-full" 
                value={formData.bid_deadline} 
                onChange={(e) => setFormData({ ...formData, bid_deadline: e.target.value })} 
                required={formData.is_open_for_bidding} 
              />
            </div>
          )}

          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium">
            Submit Proposal
          </button>
        </form>
      </Card>

      {/* Projects List */}
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-500">
                  Category: {project.category} | Budget: ₱{Number(project.budget).toLocaleString()}
                </p>
                <div className="mt-2">
                  <StatusBadge status={project.status} />
                </div>
              </div>

              {/* Award Chip & Etherscan Link */}
              {project.award_tx_hash && (
                <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full border border-green-300">
                  Won by {project.winning_bidder_name || 'N/A'}
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${project.award_tx_hash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="ml-2 text-blue-600 hover:underline font-mono"
                  >
                    (View tx)
                  </a>
                </div>
              )}
            </div>

            {/* View Bids Button */}
            {(project.is_open_for_bidding || project.winning_bid_id) && (
              <Link href={`/sk_dashboard/bids/${project.id}`}>
                <button className="self-start mt-2 border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50 font-medium">
                  View Bids
                </button>
              </Link>
            )}
          </Card>
        ))}
        {projects.length === 0 && (
          <p className="text-gray-500 text-center py-4">No projects found.</p>
        )}
      </div>
    </div>
  );
}