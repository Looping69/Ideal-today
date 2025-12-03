
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface AuthFormProps {
  view: "login" | "signup";
  onSuccess: () => void;
  onViewChange: (view: "login" | "signup") => void;
}

export default function AuthForm({ view, onSuccess, onViewChange }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (view === "signup") {
        const ref = new URLSearchParams(window.location.search).get('ref') || undefined;
        const hostRef = new URLSearchParams(window.location.search).get('host_ref') || undefined;
        const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) || undefined;
        const computedRedirect = (siteUrl && siteUrl.length > 0 ? siteUrl : window.location.origin).replace('127.0.0.1', 'localhost');
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: computedRedirect,
            data: ref || hostRef ? { referral_code: ref, host_referral_code: hostRef } : undefined,
          },
        });
        if (error) throw error;

        if (data.session) {
          toast({
            title: "Welcome!",
            description: "Account created successfully.",
          });
          onSuccess();
        } else {
          toast({
            title: "Account created",
            description: "Please verify your email. Then return here to log in.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) {
          const msg =
            /email/i.test(error.message) && /confirm/i.test(error.message)
              ? "Please verify your email before logging in."
              : error.message;
          throw new Error(msg);
        }
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {view === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {view === "login"
            ? "Enter your email to sign in to your account"
            : "Enter your email below to create your account"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <Button className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {view === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          {view === "login" ? "Don't have an account? " : "Already have an account? "}
        </span>
        <Button
          variant="link"
          className="p-0 h-auto font-semibold"
          onClick={() => onViewChange(view === "login" ? "signup" : "login")}
        >
          {view === "login" ? "Sign up" : "Log in"}
        </Button>
      </div>
    </div>
  );
}
