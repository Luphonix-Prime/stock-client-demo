import { Link } from "wouter";
import { Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center h-full bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2" data-testid="text-404">404</h1>
          <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">
              <Home className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
