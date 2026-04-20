import { UserAccount } from './types';

export const renderSidebar = (user: UserAccount): string => {
    return `
    <aside class="w-64 bg-indigo-900 text-white flex flex-col h-screen sticky top-0">
        <div class="p-6 text-2xl font-bold border-b border-indigo-800 tracking-tight">
            SK-Ledge <span class="text-xs block font-normal text-indigo-400">Governance Portal</span>
        </div>
        
        <div class="p-6 flex items-center space-x-3 border-b border-indigo-800/50">
            <div class="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
                ${user.name.charAt(0)}
            </div>
            <div>
                <p class="text-sm font-semibold truncate w-32">${user.name}</p>
                <p class="text-xs text-indigo-300">SK ${user.role}</p>
            </div>
        </div>

        <nav class="flex-grow p-4 space-y-1">
            <a href="/" class="nav-item active"><i class="fas fa-th-large mr-3"></i> Dashboard</a>
            <a href="/projects" class="nav-item"><i class="fas fa-tasks mr-3"></i> Projects</a>
            <a href="/upload" class="nav-item"><i class="fas fa-cloud-upload-alt mr-3"></i> Upload Files</a>
            <a href="/account" class="nav-item"><i class="fas fa-user-circle mr-3"></i> Account Info</a>
        </nav>

        <div class="p-4 bg-indigo-950">
            <button id="logoutBtn" class="w-full flex items-center justify-center p-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all">
                <i class="fas fa-sign-out-alt mr-2"></i> Sign Out
            </button>
        </div>
    </aside>
    `;
};