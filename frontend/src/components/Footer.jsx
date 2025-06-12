import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white w-full py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center">
          <Link href="/">
            <div className="relative w-48 h-20">
              <Image
                src="/assets/logo/logo_dark_3.png"
                fill
                style={{ objectFit: "contain" }}
                alt="app-logo"
              />
            </div>
          </Link>
        </div>

        <div className="flex justify-center space-x-4 text-sm text-gray-400 mt-2">
          <a
            href="mailto:support@sneakerscout.com"
            className="hover:text-white"
          >
            Email
          </a>
          <a href="#" className="hover:text-white">
            Instagram
          </a>
          <a href="#" className="hover:text-white">
            Twitter
          </a>
          <a href="#" className="hover:text-white">
            YouTube
          </a>
        </div>
        <div className="text-sm text-gray-500 pt-4 border-t border-gray-800 mt-4">
          &copy; {new Date().getFullYear()} SneakPeek. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
