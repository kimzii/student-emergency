"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Call the backend API for signup
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, role }),
    });
    const result = await res.json();

    if (!res.ok || result.error) {
      setError(result.error || "Signup failed");
    } else {
      setMessage(result.message || "Check your email for a confirmation link.");
      if (result.user?.id) setUserId(result.user.id);
    }
    setLoading(false);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto p-0 border bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center w-full">
            Sign Up
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSignup} className="flex flex-col gap-6 px-6 pb-6">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-gray-400 transition"
            >
              <option value="" disabled>
                Select role
              </option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
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
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
          {error && (
            <Alert variant="destructive" className="mt-2">
              {error}
            </Alert>
          )}
          {message && <Alert className="mt-2">{message}</Alert>}
        </form>
      </Card>
    </>
  );
}
