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
import { PlusCircle } from "lucide-react"
import { results } from "@/lib/data"

export default function ResultsPage() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            <div>Results</div>
          </CardTitle>
          <CardDescription>
            Log and view experimental results.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Log Result
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Result ID</TableHead>
              <TableHead>Experiment</TableHead>
              <TableHead>Date Recorded</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Data Snippet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-mono text-xs">{result.id}</TableCell>
                <TableCell className="font-medium">{result.experiment}</TableCell>
                <TableCell>{result.date}</TableCell>
                <TableCell>{result.recordedBy}</TableCell>
                <TableCell className="font-mono text-xs max-w-sm truncate">{result.dataSnippet}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
