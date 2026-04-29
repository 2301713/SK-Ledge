
export default function AccountPage() {
 
  const user = {
    name: "Juan Dela Cruz",
    role: "SK Chairperson",
    email: "juan.delacruz@barangay.gov",
    barangay: "Brgy. San Jose",
    joined: "June 2024"
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Account Details</h1>
          <p className="text-secondary-foreground">View and manage your official SK profile information.</p>
        </header>
        
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          
          <div className="h-2 bg-tertiary" />
          
          <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
              
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-secondary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-primary-foreground">{user.name}</h2>
                <p className="text-information font-medium">{user.role}</p>
              </div>
            </div>

           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 border-t border-border pt-10">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-secondary-foreground">Email Address</p>
                <p className="text-lg text-primary-foreground">{user.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-secondary-foreground">Barangay Assignment</p>
                <p className="text-lg text-primary-foreground">{user.barangay}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-secondary-foreground">Member Since</p>
                <p className="text-lg text-primary-foreground">{user.joined}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-secondary-foreground">Account Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-success"></span>
                  <p className="text-lg font-medium text-success">Verified Official</p>
                </div>
              </div>
            </div>

           
            <div className="mt-12 flex flex-wrap gap-4 pt-6 border-t border-border">
              <button className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:brightness-110 transition-all">
                Update Profile
              </button>
              <button className="px-6 py-2 border border-border text-primary-foreground rounded-lg font-semibold hover:bg-secondary transition-all">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}