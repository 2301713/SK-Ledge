import { Bell, Command, Mail, Search } from "lucide-react";

interface TopBarProps {
  userName: string;
  userEmail?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideSearch?: boolean;
  className?: string;
}

export default function TopBar({
  userName,
  userEmail,
  searchValue,
  onSearchChange,
  hideSearch = false,
  className = "",
}: TopBarProps) {
  const hasSearch = typeof onSearchChange === "function";

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {!hideSearch && (
      <div className="relative w-full max-w-md flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          readOnly={!hasSearch}
          placeholder="Search users..."
          className="w-full rounded-2xl border border-border bg-white py-2.5 pl-11 pr-16 text-sm text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-secondary-foreground focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
          <Command className="h-2.5 w-2.5" />
          F
        </span>
      </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <button
          title="Messages"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-secondary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:text-primary"
        >
          <Mail className="h-4 w-4" />
        </button>
        <button
          title="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-secondary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight text-primary-foreground">
              {userName}
            </p>
            {userEmail && (
              <p className="text-xs text-secondary-foreground">{userEmail}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
