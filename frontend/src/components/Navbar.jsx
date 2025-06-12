"use client";

import useAuth from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { BiLogOutCircle } from "react-icons/bi";
import { motion } from "motion/react";
import { publicAxios } from "@/lib/axios";

export default function Navbar() {
  const { auth, setAuth } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const navigateToSearch = (e) => {
    e.preventDefault();
    if (!input) return;

    router.push(`/search?query=${input}`);
  };

  const logout = async () => {
    try {
      await publicAxios.post("/auth/logout", {}, { withCredentials: true });
      setAuth({});

      router.push("/sign-in");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <nav className="relative flex items-center p-5 h-[100px]">
      <div className="absolute left-1/2 -translate-x-1/2">
        <Link href="/">
          <div className="relative w-64 h-20 justify-self-center">
            <Image
              src="/assets/logo/logo_light_3.png"
              fill
              style={{ objectFit: "contain" }}
              alt="app-logo"
            />
          </div>
        </Link>
      </div>
      <div className="relative space-x-2.5 flex items-center ml-auto">
        <form
          onSubmit={navigateToSearch}
          className="flex items-center space-x-2 bg-[#ececec] py-2 px-3 rounded-full"
        >
          <FiSearch size={16} />
          <input
            placeholder="Search"
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            className="bg-transparent outline-none"
          />
        </form>
        {auth?.user ? (
          <>
            <div
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer relative w-11 h-11 rounded-full border border-gray-300 p-1 overflow-hidden"
            >
              <Image
                src={auth?.user?.picture || "/assets/profile_default.png"}
                alt="profile-picture"
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto rounded-full object-cover"
              />
            </div>

            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={
                isOpen
                  ? { height: "auto", opacity: 1 }
                  : { height: 0, opacity: 0 }
              }
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute top-full -right-1 rounded-md mt-2 w-full bg-white shadow-xl z-20"
            >
              <div className="flex items-center space-x-3 mt-5 px-5">
                <div className="relative w-9 h-9 rounded-full overflow-hidden">
                  <Image
                    src={auth?.user?.picture || "/assets/profile_default.png"}
                    alt="profile-picture"
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto rounded-full object-cover"
                  />
                </div>
                <div>
                  <h6 className="text-sm font-medium">{auth?.user?.name}</h6>
                  <p className="text-xs">{auth?.user?.email}</p>
                </div>
              </div>

              <div className="mt-3">
                <div
                  onClick={logout}
                  className="cursor-pointer px-8 py-4 flex items-center space-x-5 hover:bg-gray-100 rounded-b-md"
                >
                  <BiLogOutCircle color="gray" />
                  <p className="text-sm">Sign out</p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <div
            onClick={() => router.push("/sign-in")}
            className="cursor-pointer relative w-11 h-11 rounded-full border border-gray-300 p-1 overflow-hidden"
          >
            <Image
              src="/assets/profile_default.png"
              alt="profile-picture"
              width={0}
              height={0}
              sizes="100vw"
              className="w-full h-auto rounded-full object-cover"
            />
          </div>
        )}
      </div>
    </nav>
  );
}
