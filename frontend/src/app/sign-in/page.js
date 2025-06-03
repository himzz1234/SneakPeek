"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { publicAxios } from "@/lib/axios";
import Image from "next/image";
import GoogleSignInButton from "@/components/GoogleButton";

export default function SignIn() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const handleGoogleResponse = async (response) => {
    try {
      const res = await publicAxios.post(
        "/auth/google-login",
        { idToken: response.credential },
        { withCredentials: true }
      );

      const { user, accessToken } = res.data;
      setAuth({ user, accessToken });
      router.push("/");
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);

    try {
      const res = await publicAxios.post(
        "/auth/signin",
        JSON.stringify(formData),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const { user, accessToken } = res.data;
      setAuth({ user, accessToken });
      router.push("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#f3f4f6] px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-xl">
        <div className="flex justify-center mb-6">
          <Image
            src="/assets/logo/logo_light_3.png"
            width={180}
            height={60}
            alt="App Logo"
            className="object-contain"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GoogleSignInButton onSuccess={handleGoogleResponse} />
          <div className="relative border-t border-gray-200 pt-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  disabled={pending}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014c2d] transition"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  disabled={pending}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014c2d] transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 font-medium bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-[#014c2d] hover:bg-[#026b42] transition text-white font-semibold py-2 px-4 rounded-lg shadow"
              >
                {pending ? "Signing In..." : "Sign In"}
              </button>
            </div>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/sign-up">
              <span className="font-semibold text-[#014c2d] hover:underline">
                Sign Up
              </span>
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
