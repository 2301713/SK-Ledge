import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center space-y-6 bg-slate-900 p-8 rounded-xl shadow-2xl border-t-4 border-red-500">
        
        {/* Warning Icon - Red */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4">
            <svg 
              className="h-12 w-12 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="2" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
          Unauthorized Access
        </h1>
        
        {/* Message */}
        <p className="mt-2 text-base text-slate-300">
          Sorry, you do not have the required access level or permissions to view this dashboard page.
        </p>
        
        {/* Return Button - Yellow with Dark Blue Text */}
        <div className="mt-8 flex justify-center">
          <Link 
            href="/login"
            className="rounded-md bg-yellow-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-yellow-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 transition-all duration-200"
          >
            Return to Login
          </Link>
        </div>

      </div>
    </div>
  );
}