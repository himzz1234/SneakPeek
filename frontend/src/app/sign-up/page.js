"use client";

import Image from "next/image";
import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";
import GoogleSignInButton from "@/components/GoogleButton";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
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
    setError(null);

    try {
      const res = await axios.post(
        "http://localhost:8080/api/auth/signup",
        JSON.stringify(formData),
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log(res.data);
    } catch (err) {
      setError("Signup failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 space-y-6">
        <div className="flex justify-center">
          <Image
            src="/assets/logo/logo_light_3.png"
            width={180}
            height={60}
            alt="Logo"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GoogleSignInButton onSuccess={handleGoogleResponse} />
          <div className="relative border-t border-gray-200 pt-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  disabled={pending}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#014c2d] transition"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
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
                  id="password"
                  type="password"
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
                className="w-full bg-[#014c2d] hover:bg-[#013c24] transition text-white rounded-lg py-2 font-semibold"
              >
                {pending ? "Signing Up..." : "Sign Up"}
              </button>
            </div>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[#014c2d] hover:underline font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
