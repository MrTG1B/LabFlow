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
import { experiments } from "@/lib/data"

export default function ExperimentsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Experiments</CardTitle>
          <CardDescription>
            Log and track all ongoing experiments.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Experiment
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Experiment</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Personnel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell className="font-medium">{exp.name}</TableCell>
                <TableCell>{exp.project}</TableCell>
                <TableCell>{exp.personnel}</TableCell>
                <TableCell>
                  <Badge variant={exp.status === 'Completed' ? 'default' : 'secondary'} className={exp.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-500' : exp.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                    {exp.status}
                  </Badge>
                </TableCell>
                <TableCell>{exp.startDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
