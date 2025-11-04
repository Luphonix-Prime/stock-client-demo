import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Package, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrderDialog } from "@/components/create-order-dialog";
import { OrderCard } from "@/components/order-card";
import { QRScannerDialog } from "@/components/qr-scanner-dialog";
import type { OrderWithItems } from "@shared/schema";

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const statuses = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleScan = (result: string) => {
    // Logic to handle scanned QR code (e.g., find product by code)
    console.log("Scanned:", result);
    setIsScannerOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
                  Orders
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage and track your orders
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  variant="outline"
                  data-testid="button-scan-product"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan Product
                </Button>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  data-testid="button-create-order"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by number or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {statuses.map((status) => (
                <Badge
                  key={status.value}
                  variant={selectedStatus === status.value ? "default" : "outline"}
                  className="cursor-pointer hover-elevate active-elevate-2"
                  onClick={() => setSelectedStatus(status.value)}
                  data-testid={`badge-status-${status.value}`}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground" data-testid="text-order-count">
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-state">
                  No orders found
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  {searchQuery || selectedStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first order"}
                </p>
                {!searchQuery && selectedStatus === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-order">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
      <QRScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onProductScanned={(product) => {
          console.log("Scanned product:", product);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
}