import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Users, BookOpen, GitBranch, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Contact Records", path: "/accounts", icon: Users },
  { label: "Publications", path: "/titles", icon: BookOpen },
  { label: "Scenarios", path: "/scenarios", icon: GitBranch },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">
            Hand<span className="font-normal text-muted-foreground">AI</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              P
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-foreground">PNW Marketing</p>
              <p className="truncate text-xs text-muted-foreground">pnwmarketingteam@outlook.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
