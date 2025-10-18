
'use client';

import { useMemo, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { Badge } from "@/components/ui/badge"
import { IndianRupee, Boxes, Users, Package, Printer } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { InventoryItem, InventoryItemType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Barcode from 'react-barcode';


const typeColorMap: Record<InventoryItemType, string> = {
    'Capacitor': 'hsl(var(--chart-1))',
    'Resistor': 'hsl(var(--chart-2))',
    'IC': 'hsl(var(--chart-3))',
    'Connector': 'hsl(var(--chart-4))',
    'Misc': 'hsl(var(--chart-5))',
};

const chartConfig: ChartConfig = {
  items: {
    label: "Items",
  },
  Capacitor: {
    label: "Capacitors",
    color: "hsl(var(--chart-1))",
  },
  Resistor: {
    label: "Resistors",
    color: "hsl(var(--chart-2))",
  },
  IC: {
    label: "ICs",
    color: "hsl(var(--chart-3))",
  },
  Connector: {
    label: "Connectors",
    color: "hsl(var(--chart-4))",
  },
  Misc: {
    label: "Misc",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export default function Dashboard() {
  const firestore = useFirestore();
  const [itemToPrint, setItemToPrint] = useState<InventoryItem | null>(null);
  const printComponentRef = useRef(null);

  const inventoryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventory'));
  }, [firestore]);
  const { data: inventory, isLoading: isLoadingInventory } = useCollection<InventoryItem>(inventoryQuery);

  const recentItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'inventory'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);
  const { data: recentItems, isLoading: isLoadingRecent } = useCollection<InventoryItem>(recentItemsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'));
  }, [firestore]);
  const { data: vendors, isLoading: isLoadingVendors } = useCollection<Vendor>(vendorsQuery);

  const { stats, inventoryChartData } = useMemo(() => {
    if (!inventory) return { stats: { totalValue: 0, lowStockCount: 0 }, inventoryChartData: [] };
    
    const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * (item.rate || 0)), 0);
    const lowStockCount = inventory.filter(item => item.quantity < 10).length;

    const typeCounts = inventory.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
    }, {} as Record<InventoryItemType, number>);

    const chartData = Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
        fill: typeColorMap[type as InventoryItemType],
    }));

    return { stats: { totalValue, lowStockCount }, inventoryChartData: chartData };
  }, [inventory]);

  const isLoading = isLoadingInventory || isLoadingRecent || isLoadingVendors;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printComponentRef.current) {
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<style>@media print { body { -webkit-print-color-adjust: exact; } @page { size: 3in 1.5in; margin: 0.1in; } .label { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; } .item-name { font-family: sans-serif; font-weight: bold; margin-bottom: 5px; font-size: 12px; text-align: center; } svg { height: 50px; } }</style>');
        printWindow.document.write('</head><body>');
        const printContent = (printComponentRef.current as HTMLDivElement).innerHTML;
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
    }
  };


  return (
    <>
      <div className="flex flex-col gap-8 animate-in">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inventory Value
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">₹{stats.totalValue.toFixed(2)}</div>}
              <p className="text-xs text-muted-foreground">
                Based on quantity and rate
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Items Low on Stock
              </CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.lowStockCount}</div>}
              <p className="text-xs text-muted-foreground">
                Items with quantity less than 10
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vendors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{vendors?.length || 0}</div>}
              <p className="text-xs text-muted-foreground">
                Number of registered suppliers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="animate-in transition-all hover:shadow-lg">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  Inventory Distribution
              </CardTitle>
              <CardDescription>
                  Distribution of items by type.
              </CardDescription>
              </CardHeader>
              <CardContent>
                  {isLoading ? <Skeleton className="h-[200px] w-full" /> : 
                      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                          <PieChart>
                              <ChartTooltip content={<ChartTooltipContent nameKey="type" />} />
                              <Pie data={inventoryChartData} dataKey="count" nameKey="type" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                  {inventoryChartData.map((entry) => (
                                      <Cell key={`cell-${entry.type}`} fill={entry.fill} />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ChartContainer>
                  }
              </CardContent>
          </Card>

          <Card className="animate-in transition-all hover:shadow-lg">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Recently Added Items
              </CardTitle>
              </CardHeader>
              <CardContent>
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                      </TableRow>
                  ))}
                  {!isLoading && recentItems?.length === 0 && (
                      <TableRow>
                      <TableCell colSpan={4} className="text-center">
                          No items have been added yet.
                      </TableCell>
                      </TableRow>
                  )}
                  {!isLoading && recentItems?.map(item => (
                      <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                              <Badge variant="outline">{item.type}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                              {item.createdAt ? `${formatDistanceToNow(new Date(item.createdAt))} ago` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setItemToPrint(item)} disabled={!item.barcode}>
                                  <Printer className="h-4 w-4" />
                                  <span className="sr-only">Print Barcode</span>
                              </Button>
                          </TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
          </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={!!itemToPrint} onOpenChange={(open) => !open && setItemToPrint(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Print Barcode</DialogTitle>
            <DialogDescription>
              Print a barcode label for {itemToPrint?.name}.
            </DialogDescription>
          </DialogHeader>
          {itemToPrint && itemToPrint.barcode && (
            <div ref={printComponentRef} className="py-4 flex items-center justify-center">
                <div className="label">
                    <div className="item-name">{itemToPrint.name}</div>
                    <Barcode value={itemToPrint.barcode} />
                </div>
            </div>
          )}
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setItemToPrint(null)}>
              Close
            </Button>
            <Button type="button" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

