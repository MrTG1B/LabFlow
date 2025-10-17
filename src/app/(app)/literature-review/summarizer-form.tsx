
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { getSummary } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { SummarizePaperOutput } from "@/ai/flows/ai-scientific-paper-summarizer";

const formSchema = z.object({
  paperText: z.string().min(100, {
    message: "Paper text must be at least 100 characters.",
  }),
});

export function SummarizerForm() {
  const [summary, setSummary] = useState<SummarizePaperOutput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paperText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSummary(null);

    const result = await getSummary(values);

    if (result.success) {
      setSummary(result.summary);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }

    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="paperText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paper Text</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste the full text of the scientific paper here..."
                    className="min-h-[200px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Summarize Paper
          </Button>
        </form>
      </Form>

      {isSubmitting && (
        <Card className="animate-pulse">
          <CardHeader>
            <CardTitle>Generating Summary...</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{summary.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
