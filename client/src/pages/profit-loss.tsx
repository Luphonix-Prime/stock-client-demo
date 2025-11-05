
```typescript
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import type { Product, OrderWithItems, ReturnWithItems, Account } from "@shared/schema";
import { format, startOfDay, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns";

type TimeRange = "hourly" | "daily" | "monthly" | "yearly";

interface ProfitData {
  period: string;
  purchaseProfit: number;
  purchaseLoss: number;
  salesProfit: number;
  salesLoss: number;
  totalProfit: number;
  totalLoss: number;
  revenue: number;
  cost: number;
  orders: number;
  returns: number;
}

export default function ProfitLoss() {
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const { data: returns = [], isLoading: returnsLoading } = useQuery<ReturnWithItems[]>({
    queryKey: ["/api/returns"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const isLoading = productsLoading || ordersLoading || returnsLoading || accountsLoading;

  // Create a product lookup map for cost prices
  const productMap = useMemo(() => {
    return new Map(products.map(p => [p.id, p]));
  }, [products]);

  // Calculate profit/loss data grouped by time period
  const profitData = useMemo(() => {
    const now = new Date();
    let periods: Date[] = [];
    let formatString = "";

    switch (timeRange) {
      case "hourly":
        for (let i = 23; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(now.getHours() - i, 0, 0, 0);
          periods.push(date);
        }
        formatString = "HH:00";
        break;
      case "daily":
        for (let i = 29; i >= 0; i--) {
          periods.push(subDays(startOfDay(now), i));
        }
        formatString = "MMM dd";
        break;
      case "monthly":
        for (let i = 11; i >= 0; i--) {
          periods.push(subMonths(startOfMonth(now), i));
        }
        formatString = "MMM yyyy";
        break;
      case "yearly":
        for (let i = 4; i >= 0; i--) {
          periods.push(subYears(startOfYear(now), i));
        }
        formatString = "yyyy";
        break;
    }

    const data: ProfitData[] = periods.map(period => {
      const nextPeriod = new Date(period);
      switch (timeRange) {
        case "hourly":
          nextPeriod.setHours(nextPeriod.getHours() + 1);
          break;
        case "daily":
          nextPeriod.setDate(nextPeriod.getDate() + 1);
          break;
        case "monthly":
          nextPeriod.setMonth(nextPeriod.getMonth() + 1);
          break;
        case "yearly":
          nextPeriod.setFullYear(nextPeriod.getFullYear() + 1);
          break;
      }

      // Filter orders for this period
      const periodOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt!);
        return orderDate >= period && orderDate < nextPeriod;
      });

      // Filter returns for this period
      const periodReturns = returns.filter(r => {
        const returnDate = new Date(r.createdAt!);
        return returnDate >= period && returnDate < nextPeriod;
      });

      // Filter purchase accounts for this period
      const periodPurchases = accounts.filter(a => {
        const txDate = new Date(a.transactionDate!);
        return a.transactionType === "purchase" && txDate >= period && txDate < nextPeriod;
      });

      // Calculate purchase profit and loss
      let purchaseProfit = 0;
      let purchaseLoss = 0;
      periodPurchases.forEach(acc => {
        const profit = parseFloat(acc.profit.toString());
        if (profit > 0) {
          purchaseProfit += profit;
        } else if (profit < 0) {
          purchaseLoss += Math.abs(profit);
        }
      });

      // Calculate sales revenue
      const revenue = periodOrders.reduce((sum, order) => {
        return sum + parseFloat(order.totalAmount.toString());
      }, 0);

      // Calculate cost of goods sold
      let cogs = 0;
      periodOrders.forEach(order => {
        order.items.forEach(item => {
          const product = productMap.get(item.productId);
          const costPrice = product?.costPrice ? parseFloat(product.costPrice.toString()) : 0;
          cogs += costPrice * item.quantity;
        });
      });

      // Calculate sales profit and loss
      const salesRevenue = revenue;
      const salesCost = cogs;
      const salesDifference = salesRevenue - salesCost;
      
      let salesProfit = 0;
      let salesLoss = 0;
      if (salesDifference > 0) {
        salesProfit = salesDifference;
      } else if (salesDifference < 0) {
        salesLoss = Math.abs(salesDifference);
      }

      // Subtract refunded amounts
      const refundAmount = periodReturns.reduce((sum, ret) => {
        return sum + (ret.refundAmount ? parseFloat(ret.refundAmount.toString()) : 0);
      }, 0);

      // Adjust sales profit/loss for returns
      let returnedCost = 0;
      periodReturns.forEach(ret => {
        ret.items.forEach(item => {
          const product = productMap.get(item.productId);
          const costPrice = product?.costPrice ? parseFloat(product.costPrice.toString()) : 0;
          returnedCost += costPrice * item.quantity;
        });
      });

      const netRevenue = salesRevenue - refundAmount;
      const netCost = salesCost - returnedCost;
      const netSalesDifference = netRevenue - netCost;

      if (netSalesDifference > 0) {
        salesProfit = netSalesDifference;
        salesLoss = 0;
      } else if (netSalesDifference < 0) {
        salesProfit = 0;
        salesLoss = Math.abs(netSalesDifference);
      }

      const totalProfit = purchaseProfit + salesProfit;
      const totalLoss = purchaseLoss + salesLoss;

      return {
        period: format(period, formatString),
        purchaseProfit: parseFloat(purchaseProfit.toFixed(2)),
        purchaseLoss: parseFloat(purchaseLoss.toFixed(2)),
        salesProfit: parseFloat(salesProfit.toFixed(2)),
        salesLoss: parseFloat(salesLoss.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        totalLoss: parseFloat(totalLoss.toFixed(2)),
        revenue: parseFloat(netRevenue.toFixed(2)),
        cost: parseFloat(netCost.toFixed(2)),
        orders: periodOrders.length,
        returns: periodReturns.length,
      };
    });

    return data;
  }, [orders, returns, productMap, timeRange, accounts]);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    const totalPurchaseProfit = profitData.reduce((sum, d) => sum + d.purchaseProfit, 0);
    const totalPurchaseLoss = profitData.reduce((sum, d) => sum + d.purchaseLoss, 0);
    const totalSalesProfit = profitData.reduce((sum, d) => sum + d.salesProfit, 0);
    const totalSalesLoss = profitData.reduce((sum, d) => sum + d.salesLoss, 0);
    
    const totalProfit = totalPurchaseProfit + totalSalesProfit;
    const totalLoss = totalPurchaseLoss + totalSalesLoss;
    const netProfit = totalProfit - totalLoss;

    const totalRevenue = profitData.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = profitData.reduce((sum, d) => sum + d.cost, 0);
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const inventoryValue = products.reduce((sum, p) => {
      const costPrice = p.costPrice ? parseFloat(p.costPrice.toString()) : 0;
      return sum + (costPrice * p.stockQuantity);
    }, 0);

    const totalOrders = profitData.reduce((sum, d) => sum + d.orders, 0);
    const totalReturns = profitData.reduce((sum, d) => sum + d.returns, 0);
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

    return {
      totalPurchaseProfit,
      totalPurchaseLoss,
      totalSalesProfit,
      totalSalesLoss,
      totalProfit,
      totalLoss,
      netProfit,
      totalRevenue,
      totalCost,
      profitMargin,
      inventoryValue,
      totalOrders,
      totalReturns,
      returnRate,
    };
  }, [profitData, products]);

  const chartConfig = {
    purchaseProfit: {
      label: "Purchase Profit",
      color: "#10b981",
    },
    purchaseLoss: {
      label: "Purchase Loss",
      color: "#f59e0b",
    },
    salesProfit: {
      label: "Sales Profit",
      color: "#3b82f6",
    },
    salesLoss: {
      label: "Sales Loss",
      color: "#ef4444",
    },
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
                Profit & Loss Statement
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive financial analysis and reporting
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Time Range:</span>
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger className="w-[180px]" data-testid="select-time-range">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly (24h)</SelectItem>
                  <SelectItem value="daily">Daily (30d)</SelectItem>
                  <SelectItem value="monthly">Monthly (12m)</SelectItem>
                  <SelectItem value="yearly">Yearly (5y)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-purchase-profit">
                  ${statistics.totalPurchaseProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From inventory purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Loss</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="stat-purchase-loss">
                  ${statistics.totalPurchaseLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From inventory purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-sales-profit">
                  ${statistics.totalSalesProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {statistics.totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Loss</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-sales-loss">
                  ${statistics.totalSalesLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From sales transactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-total-profit">
                  ${statistics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Purchase + Sales profit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loss</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-total-loss">
                  ${statistics.totalLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Purchase + Sales loss
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
                <BarChart3 className={statistics.netProfit >= 0 ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-red-600'} />
              </CardHeader>
              <CardContent>
                <div className={statistics.netProfit >= 0 ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-red-600'} data-testid="stat-net-profit">
                  ${statistics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.profitMargin.toFixed(2)}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Purchase Profit Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Profit Trend</CardTitle>
                <CardDescription>Profit from inventory purchases over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="purchaseProfit" fill="#10b981" name="Purchase Profit" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Purchase Loss Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Loss Trend</CardTitle>
                <CardDescription>Loss from inventory purchases over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="purchaseLoss" fill="#f59e0b" name="Purchase Loss" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Sales Profit Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Profit Trend</CardTitle>
                <CardDescription>Profit from sales transactions over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="salesProfit" fill="#3b82f6" name="Sales Profit" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Sales Loss Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Loss Trend</CardTitle>
                <CardDescription>Loss from sales transactions over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="salesLoss" fill="#ef4444" name="Sales Loss" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Combined Profit/Loss Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Combined Profit & Loss Overview</CardTitle>
              <CardDescription>All profit and loss metrics in one view</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <LineChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="purchaseProfit" stroke="#10b981" strokeWidth={2} name="Purchase Profit" />
                    <Line type="monotone" dataKey="purchaseLoss" stroke="#f59e0b" strokeWidth={2} name="Purchase Loss" />
                    <Line type="monotone" dataKey="salesProfit" stroke="#3b82f6" strokeWidth={2} name="Sales Profit" />
                    <Line type="monotone" dataKey="salesLoss" stroke="#ef4444" strokeWidth={2} name="Sales Loss" />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Detailed Period Table */}
          <Card>
            <CardHeader>
              <CardTitle>Period Details</CardTitle>
              <CardDescription>Detailed profit/loss by {timeRange} period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Purchase Profit</TableHead>
                      <TableHead className="text-right">Purchase Loss</TableHead>
                      <TableHead className="text-right">Sales Profit</TableHead>
                      <TableHead className="text-right">Sales Loss</TableHead>
                      <TableHead className="text-right">Total Profit</TableHead>
                      <TableHead className="text-right">Total Loss</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitData.map((item, idx) => {
                      const net = item.totalProfit - item.totalLoss;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.period}</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            ${item.purchaseProfit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600 font-semibold">
                            ${item.purchaseLoss.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-semibold">
                            ${item.salesProfit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            ${item.salesLoss.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            ${item.totalProfit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            ${item.totalLoss.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${net.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```
