"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { publicAxios } from "@/lib/axios";
import { useSearchParams } from "next/navigation";

export default function ProductCard({ product }) {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("query");
  const firstSource = product.sources[0];
  const thumbnail = firstSource?.image || "/placeholder.jpg";

  const handleClick = async () => {
    try {
      await publicAxios.post("/products/click", {
        productId: product._id,
        ...(searchTerm && { searchTerm }),
      });
    } catch (error) {
      console.error("Error logging product click:", error);
    }
  };

  return (
    <div className="rounded-lg">
      <div className="relative w-full h-64 bg-[#ededef] mix-blend-multiply rounded-md">
        <Link
          href={`/products/${product._id}`}
          onClick={handleClick}
          target="_blank"
        >
          <Image
            src={thumbnail}
            alt={product.title}
            layout="fill"
            style={{ objectFit: "cover" }}
            className="bg-[#ededef] mix-blend-darken"
          />
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold uppercase tracking-tighter mt-2">
          {product.title}
        </h2>
        <h4 className="font-medium capitalize text-gray-500 tracking-tighter">
          {product.brand}
        </h4>
      </div>
    </div>
  );
}
