import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Link } from "@tanstack/react-router"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginValues) {
    setIsLoading(true)
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/",
      })

      if (error) {
        toast.error(error.message || "Invalid credentials")
        return
      }

      toast.success("Welcome back!")
    } catch (err) {
      console.error("Login error:", err)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm animate-in space-y-6 duration-500 fade-in slide-in-from-bottom-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-[13px] font-medium text-muted-foreground/60">
          Enter your credentials to access the registry
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase"
          >
            Email Address
          </Label>
          <div className="group relative">
            <Mail className="absolute top-4 left-3 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
            <Input
              id="email"
              placeholder="name@hospital.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              className="h-11 border-border/40 bg-muted/30 pl-10 transition-all focus:bg-background"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
              <AlertCircle className="h-3 w-3" />
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase"
            >
              Password
            </Label>
          </div>
          <div className="group relative">
            <Lock className="absolute top-4 left-3 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              disabled={isLoading}
              className="h-11 border-border/40 bg-muted/30 pl-10 transition-all focus:bg-background"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive">
              <AlertCircle className="h-3 w-3" />
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="group h-11 w-full rounded-xl bg-primary text-sm font-semibold shadow-sm transition-all hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">New to Medcurial?</span>
          <Link
            to="/signup"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Request Access
          </Link>
        </div>
      </div>
    </div>
  )
}
