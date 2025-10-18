
'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CircuitBoard, Loader2 } from "lucide-react";
import placeholderImages from "@/lib/placeholder-images.json";
import { useAuth, useUser, useFirestore, initiateEmailSignUp, initiateGoogleSignIn, handleGoogleRedirectResult } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { salutations, genders, type Salutation, type Gender } from "@/lib/types";

const formSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  post: z.string().optional(),
  salutation: z.enum(salutations, { required_error: "Salutation is required."}),
  gender: z.enum(genders, { required_error: "Gender is required."}),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function SignupPage() {
  const signupImage = placeholderImages.placeholderImages.find(p => p.id === 'login-background');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading, userError } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      post: "",
      email: "",
      password: "",
    },
  });

   useEffect(() => {
    if(auth && firestore) {
      handleGoogleRedirectResult(auth, firestore, (error) => {
        setIsSubmitting(false);
        setAuthError(error.message);
      });
    }
  }, [auth, firestore]);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const error = authError || userError?.message;
    if (error) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error,
      });
      setIsSubmitting(false);
      setAuthError(null);
    }
  }, [authError, userError, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAuthError(null);
    if (!auth || !firestore) return;
    try {
      await initiateEmailSignUp(auth, firestore, values);
    } catch (error: any) {
        setIsSubmitting(false);
        if (error.code === 'auth/email-already-in-use') {
            setAuthError("This email is already in use. Please sign in or use a different email.");
        } else {
            setAuthError(error.message);
        }
    }
  }

  function onGoogleSignUp() {
    setIsSubmitting(true);
    setAuthError(null);
    if (!auth) return;
    initiateGoogleSignIn(auth);
  }

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CircuitBoard className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">Degen Technologies</h1>
            </div>
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="text-balance text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
               <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="salutation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salutation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {salutations.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genders.map((g) => (
                            <SelectItem key={g} value={g}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input placeholder="123-456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="post"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Post (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Lab Technician" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? <Loader2 className="animate-spin" /> : 'Sign Up'}
              </Button>
            </form>
          </Form>
           <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
            </div>
            <Button variant="outline" className="w-full" onClick={onGoogleSignUp} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.438 10.38C34.661 7.042 29.697 5 24 5C13.254 5 5 13.254 5 24s8.254 19 19 19s19-8.254 19-19c0-1.341-.138-2.65-.389-3.917z" />
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039L38.438 10.38C34.661 7.042 29.697 5 24 5C17.643 5 12.042 7.746 8.076 11.834l-1.77-1.42z" />
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.438-5.38l-6.522-5.023C29.042 36.108 26.714 37 24 37c-5.223 0-9.657-3.657-11.303-8.38H6.306v.01C8.243 36.192 15.49 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.522 5.023C42.472 35.836 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z" />
                    </svg>
                    Google
                </>}
            </Button>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/" className="underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {signupImage && (
           <Image
            src={signupImage.imageUrl}
            alt={signupImage.description}
            width="1920"
            height="1080"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            data-ai-hint={signupImage.imageHint}
          />
        )}
      </div>
    </div>
  );
}
