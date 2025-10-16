import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { PlusCircle } from "lucide-react"
import { equipment } from "@/lib/data"

export default function EquipmentPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Equipment</CardTitle>
          <CardDescription>
            Log equipment usage, maintenance, and repairs.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Log Usage
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Maintenance</TableHead>
              <TableHead>Next Maintenance</TableHead>
              <TableHead>Last Used By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'Available' ? 'outline' : 'secondary'} className={item.status === 'Available' ? 'border-green-500 text-green-500' : item.status === 'In Use' ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.lastMaintenance}</TableCell>
                <TableCell>{item.nextMaintenance}</TableCell>
                <TableCell>{item.lastUsedBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
