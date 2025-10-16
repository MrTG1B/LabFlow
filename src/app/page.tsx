
'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircuitBoard, Loader2 } from "lucide-react";
import placeholderImages from "@/lib/placeholder-images.json";
import { useAuth, useUser, initiateAnonymousSignIn } from "@/firebase";

export default function LoginPage() {
  const loginImage = placeholderImages.placeholderImages.find(p => p.id === 'login-background');
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = () => {
    setIsLoggingIn(true);
    initiateAnonymousSignIn(auth);
  };

  useEffect(() => {
    // If user is found, redirect to dashboard.
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const showSpinner = isLoggingIn || isUserLoading;

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex items-center justify-center gap-2 mb-4">
              <CircuitBoard className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold font-headline">Degen Technologies</h1>
            </div>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                defaultValue="researcher@degen.tech"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" type="password" required defaultValue="password" />
            </div>
            <Button onClick={handleLogin} disabled={showSpinner} type="button" className="w-full">
              {showSpinner ? <Loader2 className="animate-spin" /> : 'Login'}
            </Button>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            width="1920"
            height="1080"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            data-ai-hint={loginImage.imageHint}
          />
        )}
      </div>
    </div>
  );
}
