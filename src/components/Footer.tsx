import { Link } from "react-router-dom";
import { Plane, Mountain, BookmarkCheck, Package, Sparkles, MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/40 backdrop-blur-sm">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <img src="/logo.png" alt="The Explorerz" className="w-32 h-12 rounded-lg object-cover" />
              
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered travel planning for incredible Indian adventures. Your next journey starts here.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Made with ❤️ for Indian travelers
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2">
              {[
                { to: "/",        icon: Sparkles,     label: "Home" },
                { to: "/plan",    icon: Plane,        label: "Plan a Trip" },
                { to: "/packages",icon: Package,      label: "Packages" },
                { to: "/saved",   icon: BookmarkCheck,label: "Saved Trips" },
              ].map((l) => {
                const Icon = l.icon;
                return (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <Icon className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2">
              {[
                { emoji: "🛕", label: "Pilgrimage Tours" },
                { emoji: "🏔️", label: "Himalayan Treks" },
                { emoji: "🏰", label: "Heritage Circuits" },
                { emoji: "🌿", label: "Nature Escapes" },
                { emoji: "⚡", label: "Adventure Trips" },
              ].map((c) => (
                <li key={c.label}>
                  <Link
                    to="/packages"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span>{c.emoji}</span> {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2025 The Explorerz — AI-Powered Travel Planning</p>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>hello@theexplorerz.co</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
