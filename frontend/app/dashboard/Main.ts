import './style.css';
import { renderSidebar } from './SideBar';
import { Project, UserAccount } from './types';

const currentUser: UserAccount = {
    name: "Hon. Juan Dela Cruz",
    role: "Chairman",
    barangay: "Barangay Tibay"
};

const projects: Project[] = [
    { id: '1', name: 'Youth Basketball League', category: 'Sports', status: 'Approved', budget: 45000 },
    { id: '2', name: 'SK Scholarship Grant', category: 'Education', status: 'Pending', budget: 120000 },
];

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="flex">
    ${renderSidebar(currentUser)}
    
    <main class="flex-1 bg-slate-50 min-h-screen">
        <header class="h-16 bg-white border-b px-8 flex items-center justify-between">
            <h1 class="text-lg font-bold text-slate-700">${currentUser.barangay} Dashboard</h1>
            <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                + New Project
            </button>
        </header>

        <div class="p-8">
            <section class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="text-slate-500 text-sm font-medium">Total Allocated Budget</h3>
                    <p class="text-3xl font-bold text-slate-900 mt-1">₱ 1,250,000.00</p>
                </div>
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 class="text-slate-500 text-sm font-medium">Project Expenditure</h3>
                    <p class="text-3xl font-bold text-indigo-600 mt-1">₱ 165,000.00</p>
                </div>
            </section>

            <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                            <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                        ${projects.map(p => `
                            <tr>
                                <td class="px-6 py-4">
                                    <p class="font-medium text-slate-900">${p.name}</p>
                                    <p class="text-xs text-slate-500">${p.category}</p>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs rounded-full ${p.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">
                                        ${p.status}
                                    </span>
                                </td>
                                <td class="px-6 py-4 font-mono font-medium">₱${p.budget.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        </div>
    </main>
  </div>
`;