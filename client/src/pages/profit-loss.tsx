
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
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import type { Product, OrderWithItems, ReturnWithItems, StockMovement, Account } from "@shared/schema";
import { format, startOfDay, startOfHour, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns";

type TimeRange = "hourly" | "daily" | "monthly" | "yearly";

interface ProfitData {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
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

  const { data: movements = [], isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const isLoading = productsLoading || ordersLoading || returnsLoading || movementsLoading || accountsLoading;

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
        // Last 24 hours
        for (let i = 23; i >= 0; i--) {
          const date = new Date(now);
          date.setHours(now.getHours() - i, 0, 0, 0);
          periods.push(date);
        }
        formatString = "HH:00";
        break;
      case "daily":
        // Last 30 days
        for (let i = 29; i >= 0; i--) {
          periods.push(subDays(startOfDay(now), i));
        }
        formatString = "MMM dd";
        break;
      case "monthly":
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          periods.push(subMonths(startOfMonth(now), i));
        }
        formatString = "MMM yyyy";
        break;
      case "yearly":
        // Last 5 years
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

      // Calculate revenue from orders
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

      // Subtract refunded amounts and add back returned inventory cost
      const refundAmount = periodReturns.reduce((sum, ret) => {
        return sum + (ret.refundAmount ? parseFloat(ret.refundAmount.toString()) : 0);
      }, 0);

      let returnedCost = 0;
      periodReturns.forEach(ret => {
        ret.items.forEach(item => {
          const product = productMap.get(item.productId);
          const costPrice = product?.costPrice ? parseFloat(product.costPrice.toString()) : 0;
          returnedCost += costPrice * item.quantity;
        });
      });

      // Add purchase costs and potential profit from accounts
      const purchaseCost = periodPurchases.reduce((sum, acc) => {
        return sum + parseFloat(acc.cost.toString());
      }, 0);

      const purchaseProfit = periodPurchases.reduce((sum, acc) => {
        return sum + parseFloat(acc.profit.toString());
      }, 0);

      const netRevenue = revenue - refundAmount;
      const netCost = cogs - returnedCost + purchaseCost;
      const profit = netRevenue - netCost + purchaseProfit;

      return {
        period: format(period, formatString),
        revenue: parseFloat(netRevenue.toFixed(2)),
        cost: parseFloat(netCost.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        orders: periodOrders.length,
        returns: periodReturns.length,
      };
    });

    return data;
  }, [orders, returns, productMap, timeRange, accounts]);

  // Payment method statistics
  const paymentMethodStats = useMemo(() => {
    const stats: Record<string, { revenue: number; count: number }> = {
      cash: { revenue: 0, count: 0 },
      credit_card: { revenue: 0, count: 0 },
      debit_card: { revenue: 0, count: 0 },
      upi: { revenue: 0, count: 0 },
      bank_transfer: { revenue: 0, count: 0 },
      store_credit: { revenue: 0, count: 0 },
      mixed: { revenue: 0, count: 0 },
    };

    orders.forEach(order => {
      const method = order.paymentMethod || 'cash';
      const amount = parseFloat(order.totalAmount.toString());
      stats[method].revenue += amount;
      stats[method].count += 1;
    });

    returns.forEach(ret => {
      const method = ret.paymentMethod || 'cash';
      // Subtract refunds from revenue
      if (ret.refundAmount) {
        const amount = parseFloat(ret.refundAmount.toString());
        stats[method].revenue -= amount;
      }
      // Add additional payments to revenue
      if (ret.additionalPayment) {
        const amount = parseFloat(ret.additionalPayment.toString());
        stats[method].revenue += amount;
      }
    });

    return Object.entries(stats)
      .map(([method, data]) => ({
        method: method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        revenue: data.revenue,
        count: data.count,
      }))
      .filter(item => item.count > 0 || item.revenue !== 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, returns]);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    const totalRevenue = profitData.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = profitData.reduce((sum, d) => sum + d.cost, 0);
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate purchasing stats from accounts table
    const purchaseAccounts = accounts.filter(a => a.transactionType === "purchase");
    
    // Purchase profit/loss from accounts
    const purchaseProfit = purchaseAccounts.reduce((sum, a) => {
      const profit = parseFloat(a.profit.toString());
      return profit > 0 ? sum + profit : sum;
    }, 0);
    
    const purchaseLoss = purchaseAccounts.reduce((sum, a) => {
      const profit = parseFloat(a.profit.toString());
      return profit < 0 ? sum + Math.abs(profit) : sum;
    }, 0);

    // Sales profit/loss from orders
    const salesProfit = orders.reduce((sum, order) => {
      const revenue = parseFloat(order.totalAmount.toString());
      let cost = 0;
      order.items.forEach(item => {
        const product = productMap.get(item.productId);
        const costPrice = product?.costPrice ? parseFloat(product.costPrice.toString()) : 0;
        cost += costPrice * item.quantity;
      });
      const profit = revenue - cost;
      return profit > 0 ? sum + profit : sum;
    }, 0);

    const salesLoss = orders.reduce((sum, order) => {
      const revenue = parseFloat(order.totalAmount.toString());
      let cost = 0;
      order.items.forEach(item => {
        const product = productMap.get(item.productId);
        const costPrice = product?.costPrice ? parseFloat(product.costPrice.toString()) : 0;
        cost += costPrice * item.quantity;
      });
      const profit = revenue - cost;
      return profit < 0 ? sum + Math.abs(profit) : sum;
    }, 0);

    const totalProfit = purchaseProfit + salesProfit;
    const totalLoss = purchaseLoss + salesLoss;

    const totalOrders = profitData.reduce((sum, d) => sum + d.orders, 0);
    const totalReturns = profitData.reduce((sum, d) => sum + d.returns, 0);
    const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      purchaseProfit,
      purchaseLoss,
      salesProfit,
      salesLoss,
      totalProfit,
      totalLoss,
      totalOrders,
      totalReturns,
      returnRate,
    };
  }, [profitData, accounts, products, productMap, orders]);

  // Product category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown = new Map<string, { revenue: number; cost: number; profit: number }>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = productMap.get(item.productId);
        if (!product) return;

        const category = product.category;
        const revenue = parseFloat(item.subtotal.toString());
        const costPrice = product.costPrice ? parseFloat(product.costPrice.toString()) : 0;
        const cost = costPrice * item.quantity;
        const profit = revenue - cost;

        const current = breakdown.get(category) || { revenue: 0, cost: 0, profit: 0 };
        breakdown.set(category, {
          revenue: current.revenue + revenue,
          cost: current.cost + cost,
          profit: current.profit + profit,
        });
      });
    });

    return Array.from(breakdown.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));
  }, [orders, productMap]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#10b981",
    },
    cost: {
      label: "Cost",
      color: "#ef4444",
    },
    profit: {
      label: "Profit",
      color: "#3b82f6",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-purchase-profit">
                  ${statistics.purchaseProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From inventory purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Profit</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-sales-profit">
                  ${statistics.salesProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {statistics.totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-total-profit">
                  ${statistics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined profit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Loss</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-purchase-loss">
                  ${statistics.purchaseLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From inventory purchases
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales Loss</CardTitle>
                <ShoppingCart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600" data-testid="stat-sales-loss">
                  ${statistics.salesLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {statistics.totalOrders} orders
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
                  Combined loss
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Total Profit Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Total Profit</CardTitle>
                <CardDescription>Total profit over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <LineChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Total Profit" />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Total Loss and Total Sales Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Total Loss and Total Sales</CardTitle>
                <CardDescription>Loss and sales by period</CardDescription>
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
                      <Bar dataKey="cost" fill="#ef4444" name="Total Loss" />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Total Sales" />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Statistics */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment Method Statistics</CardTitle>
              <CardDescription>Revenue breakdown by payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMethodStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No payment data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentMethodStats.map((item) => {
                        const percentage = statistics.totalRevenue > 0 
                          ? (item.revenue / statistics.totalRevenue) * 100 
                          : 0;
                        return (
                          <TableRow key={item.method}>
                            <TableCell className="font-medium">{item.method}</TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                            <TableCell className={`text-right font-semibold ${item.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${Math.abs(item.revenue).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={percentage >= 30 ? "default" : "secondary"}>
                                {percentage.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Profit by Category</CardTitle>
                <CardDescription>Revenue distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="revenue"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Net Profit/Loss</span>
                  <span className={`font-semibold ${statistics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${statistics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Return Rate</span>
                  <Badge variant={statistics.returnRate > 10 ? "destructive" : "secondary"}>
                    {statistics.returnRate.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="font-semibold">{statistics.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Returns</span>
                  <span className="font-semibold">{statistics.totalReturns}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Order Value</span>
                  <span className="font-semibold">
                    ${statistics.totalOrders > 0 ? (statistics.totalRevenue / statistics.totalOrders).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Margin</span>
                  <Badge variant="outline">
                    {statistics.profitMargin.toFixed(2)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Detailed breakdown by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryBreakdown.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No category data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoryBreakdown.map((item) => {
                        const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                        return (
                          <TableRow key={item.category}>
                            <TableCell className="font-medium">{item.category}</TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              ${item.revenue.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              ${item.cost.toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${item.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              ${item.profit.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={margin >= 30 ? "default" : margin >= 15 ? "secondary" : "destructive"}>
                                {margin.toFixed(2)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Period Table */}
          <Card className="mt-6">
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
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Returns</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.period}</TableCell>
                        <TableCell className="text-right">{item.orders}</TableCell>
                        <TableCell className="text-right">{item.returns}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ${item.revenue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">
                          ${item.cost.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${item.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          ${item.profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
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
