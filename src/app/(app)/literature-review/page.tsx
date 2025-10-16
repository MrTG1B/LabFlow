import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SummarizerForm } from "./summarizer-form";

export default function LiteratureReviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Literature Review</CardTitle>
          <CardDescription>
            Paste the text of a scientific paper below to get a summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SummarizerForm />
        </CardContent>
      </Card>
    </div>
  );
}
