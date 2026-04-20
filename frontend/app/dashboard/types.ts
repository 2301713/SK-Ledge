export interface Project {
    id: string;
    name: string;
    category: 'Sports' | 'Infrastructure' | 'Health' | 'Education';
    status: 'Pending' | 'Approved' | 'Declined';
    budget: number;
}

export interface UserAccount {
    name: string;
    role: 'Chairman' | 'Treasurer';
    barangay: string;
}