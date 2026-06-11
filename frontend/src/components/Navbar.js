import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getAuth } from "../utils/auth";
import Button from "./ui/button";
import Badge from "./ui/badge";

import {
  Home,
  LayoutDashboard,
  PlusCircle,
  Package,
  FileText,
  Bell,
  Shield,
  LogOut,
  Menu,
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const auth = getAuth();
  const isLoggedIn = !!auth?.token;
  const isAdmin = auth?.role === "admin";

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-slate-800/80 hover:text-white ${
      isActive(path) ? "bg-slate-800 text-cyan-300 border border-slate-700" : "text-slate-300"
    }`;

  // Pages where only logo is shown for guests
  const minimalPages = ["/login", "/register", "/admin-login"];
  const isMinimal = minimalPages.includes(location.pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="leading-tight transition hover:opacity-90">
          <div className="text-lg font-semibold text-slate-100">Lost &amp; Found</div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Campus Hub</div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        {!isMinimal && (
          <div className="hidden md:flex items-center gap-3 text-sm font-medium">

            {!isLoggedIn && (
              <>
                <Link to="/" className={linkStyle("/")}>
                  <Home size={16} /> Home
                </Link>
                <Link to="/login" className={linkStyle("/login")}>
                  Login
                </Link>
                <Link to="/admin-login" className={linkStyle("/admin-login")}>
                  <Shield size={16} /> Admin
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-cyan-400 px-4 py-2 text-slate-950 transition hover:bg-cyan-300"
                >
                  Register
                </Link>
              </>
            )}

            {isLoggedIn && !isAdmin && (
              <>
                <Link to="/dashboard" className={linkStyle("/dashboard")}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/add-item" className={linkStyle("/add-item")}>
                  <PlusCircle size={16} /> Report
                </Link>
                <Link to="/my-items" className={linkStyle("/my-items")}>
                  <Package size={16} /> My Items
                </Link>
                <Link to="/my-claims" className={linkStyle("/my-claims")}>
                  <FileText size={16} /> Claims
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <Link to="/notifications" className={linkStyle("/notifications")}>
                    <Bell size={16} />
                  </Link>
                  <span className="absolute -top-1 -right-2 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">
                    3
                  </span>
                </div>
              </>
            )}

            {isLoggedIn && isAdmin && (
              <>
                <Badge tone="ink">Admin</Badge>
                <Link to="/admin" className={linkStyle("/admin")}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/matches" className={linkStyle("/matches")}>
                  Matches
                </Link>
              </>
            )}

            {/* Logout button */}
            {isLoggedIn && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="ml-2 flex items-center gap-1 bg-rose-500 text-white hover:bg-rose-400"
              >
                <LogOut size={16} /> Logout
              </Button>
            )}
          </div>
        )}

        {/* MOBILE MENU BUTTON */}
        {!isMinimal && (
          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-100 md:hidden"
          >
            <Menu size={18} />
          </button>
        )}

        {/* LOGOUT BUTTON ON MINIMAL PAGES (if logged in) */}
        {isMinimal && isLoggedIn && (
          <Button
            type="button"
            variant="default"
            onClick={handleLogout}
            className="ml-4 flex items-center gap-1 rounded-xl bg-rose-500 px-4 py-2 text-white transition hover:bg-rose-400"
          >
            <LogOut size={16} className="inline" /> Logout
          </Button>
        )}
      </div>

      {/* MOBILE MENU */}
      {!isMinimal && open && (
        <div className="space-y-2 border-t border-slate-800 bg-slate-950/95 px-6 py-4 text-sm md:hidden">
          {!isLoggedIn && (
            <>
              <Link to="/" className="block py-2 text-slate-200">Home</Link>
              <Link to="/login" className="block py-2 text-slate-200">Login</Link>
              <Link to="/admin-login" className="block py-2 text-slate-200">Admin</Link>
              <Link to="/register" className="block py-2 text-slate-200">Register</Link>
            </>
          )}

          {isLoggedIn && !isAdmin && (
            <>
              <Link to="/dashboard" className="block py-2 text-slate-200">Dashboard</Link>
              <Link to="/add-item" className="block py-2 text-slate-200">Report</Link>
              <Link to="/my-items" className="block py-2 text-slate-200">My Items</Link>
              <Link to="/my-claims" className="block py-2 text-slate-200">Claims</Link>
              <Link to="/notifications" className="block py-2 text-slate-200">Notifications</Link>
            </>
          )}

          {isLoggedIn && isAdmin && (
            <>
              <Link to="/admin" className="block py-2 text-slate-200">Dashboard</Link>
              <Link to="/matches" className="block py-2 text-slate-200">Matches</Link>
            </>
          )}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="block py-2 text-left font-semibold text-rose-400"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
