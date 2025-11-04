
import { Package } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Created by</span>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Package className="h-4 w-4 text-primary" />
            <span>Luphonix</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
