
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
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || sessionStorage.getItem('referral_code') || undefined;
        const hostRef = urlParams.get('host_ref') || sessionStorage.getItem('host_referral_code') || undefined;
        const siteUrl = (import.meta.env.SITE_URL as string | undefined) || undefined;
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
    <div className="space-y-8 py-6 px-2">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {view === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-base text-gray-500">
          {view === "login"
            ? "Enter your email to sign in to your account"
            : "Enter your email below to create your account"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="m@example.com"
                    {...field}
                    className="h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 bg-gray-50/50"
                  />
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
                <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    {...field}
                    className="h-12 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20 bg-gray-50/50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {view === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-gray-500">
          {view === "login" ? "Don't have an account? " : "Already have an account? "}
        </span>
        <Button
          variant="link"
          className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
          onClick={() => onViewChange(view === "login" ? "signup" : "login")}
        >
          {view === "login" ? "Sign up" : "Log in"}
        </Button>
      </div>
    </div>
  );
}
