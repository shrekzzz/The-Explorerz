import { Link, useLocation } from "react-router-dom";
import { Plane, BookmarkCheck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="DeshYatra Co." className="w-20 h-10 rounded-lg object-cover" />
          <span className="font-display text-xl font-bold text-foreground">
            DeshYatra<span className="text-primary"> Co.</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/packages">
            <Button
              variant={location.pathname === "/packages" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Packages</span>
            </Button>
          </Link>
          <Link to="/saved">
            <Button
              variant={location.pathname === "/saved" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Saved Trips</span>
            </Button>
          </Link>
          <Link to="/plan">
            <Button size="sm" className="gap-2">
              <Plane className="w-4 h-4" />
              Plan a Trip
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
