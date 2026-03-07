"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import { User, Users, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Call the backend API for signup
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role,
        phoneNumber: `+${phoneNumber.replace(/^\+/, "")}`,
      }),
    });
    const result = await res.json();

    if (!res.ok || result.error) {
      setError(result.error || "Signup failed");
    } else {
      router.replace("/login");
    }
    setLoading(false);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto border bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center w-full">
            Sign Up
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSignup} className="flex flex-col gap-6 px-6 pb-6">
          <div className="flex flex-col gap-4">
            <label className="text-sm font-medium">Role</label>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                className={`flex flex-col items-center px-4 py-2 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  role === "student"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
                onClick={() => setRole("student")}
              >
                <User className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Student</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center px-4 py-2 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  role === "parent"
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
                onClick={() => setRole("parent")}
              >
                <Users className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Parent</span>
              </button>
            </div>
            {/* Hidden input for form validation */}
            <input type="hidden" name="role" value={role} required />
            <label className="text-sm font-medium">Full Name</label>
            <Input
              type="text"
              placeholder="Enter Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <label className="text-sm font-medium">Phone Number</label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-lg select-none">+</span>
              <Input
                type="tel"
                placeholder="639123456789"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/^\+/, ""))
                }
                required
                className="flex-1"
              />
            </div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="pr-12"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
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
