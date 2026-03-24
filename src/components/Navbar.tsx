import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, BookmarkCheck, Package, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/packages", icon: Package,      label: "Packages" },
  { to: "/saved",    icon: BookmarkCheck, label: "Saved Trips" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="DeshYatra Co." className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-2">
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <Button variant={location.pathname === to ? "default" : "ghost"} size="sm" className="gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              </Link>
            ))}
            <Link to="/plan">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-md shadow-primary/20">
                <Plane className="w-4 h-4" /> Plan a Trip
              </Button>
            </Link>
          </div>

          {/* Mobile: Plan CTA + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <Link to="/plan" onClick={() => setOpen(false)}>
              <Button size="sm" className="gap-1.5 h-8 px-3 text-xs bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90">
                <Plane className="w-3.5 h-3.5" /> Plan
              </Button>
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="w-9 h-9 rounded-xl border border-border/60 bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 left-0 right-0 z-40 sm:hidden bg-card/95 backdrop-blur-xl border-b border-border shadow-xl"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {navLinks.map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} onClick={() => setOpen(false)}>
                    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      location.pathname === to
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  </Link>
                ))}
                <Link to="/plan" onClick={() => setOpen(false)}>
                  <Button className="w-full gap-2 mt-1 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/20">
                    <Plane className="w-4 h-4" /> Plan a Trip
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
