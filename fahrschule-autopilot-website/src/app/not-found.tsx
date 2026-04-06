import Link from "next/link";
import { Home, CreditCard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-muted/20">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          Seite nicht gefunden
        </h2>
        <p className="mt-2 text-muted">
          Die gewünschte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 justify-center px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Link>
          <Link
            href="/preise"
            className="inline-flex items-center gap-2 justify-center px-6 py-3 border border-border text-foreground rounded-xl font-medium hover:bg-surface-light transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Preise ansehen
          </Link>
        </div>
      </div>
    </div>
  );
}
