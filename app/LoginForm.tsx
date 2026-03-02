"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVerifyNotice(null);

    // Sign in directly with Supabase client for proper session persistence
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user && !data.user.email_confirmed_at) {
      setVerifyNotice(
        "Please check your email and verify your account before logging in.",
      );
    } else if (data.session) {
      // Redirect based on user role
      const role = data.user?.user_metadata?.role;
      if (role === "parent") {
        router.push("/parent/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto p-0 border bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center w-full">
          Login
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleLogin} className="flex flex-col gap-6 px-6 pb-6">
        <div className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
        {error && (
          <Alert variant="destructive" className="mt-2">
            {error}
          </Alert>
        )}
        {verifyNotice && <Alert className="mt-2">{verifyNotice}</Alert>}
      </form>
    </Card>
  );
}
