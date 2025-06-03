"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { getStoreData } from "@/utils/storeData";
import { IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";

const oswald = IBM_Plex_Mono({
  weight: ["100", "200", "300", "400", "600", "700"],
});

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:8080/api/products/${slug}`
        );
        const productData = res.data.product;
        setProduct(productData);

        if (!productData.description || !productData.images.length) {
          const scrapeRes = await axios.get(
            `http://localhost:8080/api/products/scrapedetails/${productData._id}`
          );
          setProduct(scrapeRes.data);
        }
      } catch (error) {
        console.error("Error fetching product:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8"></div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="mt-2 text-gray-600">
          The product you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Return to homepage
        </Link>
      </main>
    );
  }

  const currentPrice = Math.min(
    ...product.sources.map((source) => source.currentPrice)
  );
  const originalPrice = Math.max(
    ...product.sources.map((source) => source.originalPrice)
  );
  const discount = Math.round(
    ((originalPrice - currentPrice) / originalPrice) * 100
  );

  const productImages = [...product.images].slice(0, 7);

  return (
    <>
      <section className="max-w-7xl mx-auto">
        <Navbar />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex gap-4">
            {productImages.length > 1 && (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px]">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                      selectedImage === idx
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img}
                      fill
                      style={{ objectFit: "cover" }}
                      alt={`Thumbnail ${idx + 1}`}
                      className="hover:opacity-90 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative w-[400px] h-[500px] bg-[#ededef] mix-blend-multiply overflow-hidden rounded-lg">
              <Image
                src={productImages[selectedImage] || "/placeholder-product.png"}
                fill
                style={{ objectFit: "cover" }}
                className="absolute object-left"
                alt={product.title}
                priority
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="border-b-2 py-2">
                <p className="uppercase tracking-tighter text-gray-500 font-medium">
                  {product.brand}
                </p>
                <h1 className="text-4xl font-bold tracking-tighter uppercase flex-1">
                  {product.title}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <p
                  className={`text-3xl font-semibold tracking-tighter ${oswald.className}`}
                >
                  ₹{currentPrice}
                </p>
                {originalPrice > currentPrice && (
                  <>
                    <p className="text-lg text-gray-500 line-through">
                      ₹{originalPrice}
                    </p>
                  </>
                )}
                <button className="ml-auto text-sm bg-black text-white px-4 py-2 rounded transition-all">
                  Track Product
                </button>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="font-medium mb-3 text-lg">
                Available at these stores
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Store
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {product.sources
                      .sort((a, b) => a.currentPrice - b.currentPrice)
                      .map((source, index) => {
                        const storeData = getStoreData(source.name);
                        const isBestPrice =
                          source.currentPrice === currentPrice;

                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12">
                                  <Image
                                    src={storeData?.store_logo}
                                    alt=""
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <span className="font-medium">
                                  {source.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-baseline gap-2">
                                <span
                                  className={`font-semibold text-lg tracking-tighter ${oswald.className}`}
                                >
                                  ₹{source.currentPrice}
                                </span>
                                {source.originalPrice > source.currentPrice && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₹{source.originalPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <Link
                                href={source.link}
                                target="_blank"
                                className="text-sm px-3 py-2 rounded
                                text-black hover:bg-blue-50"
                              >
                                Visit Store
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16 border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Product Details</h2>
          <div className="prose max-w-none">
            {product.description && <p>{product.description}</p>}
            <ul className="mt-5 list-disc px-4">
              {product.specs.map((spec, index) => (
                <li key={index}>{spec}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
