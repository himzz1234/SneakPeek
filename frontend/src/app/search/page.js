"use client";

import axios from "axios";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard";
import FilterWindow from "@/components/FilterWindow";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableFilters, setAvailableFilters] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedParams, setAppliedParams] = useState(searchParams.toString());

  const query = searchParams.get("query");

  useEffect(() => {
    setAppliedParams(searchParams.toString());
  }, [query]);

  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
  }, [appliedParams]);

  useEffect(() => {
    const searchProducts = async () => {
      if (loading) return;

      setLoading(true);
      try {
        const params = new URLSearchParams(appliedParams);
        params.set("page", currentPage);

        const res = await axios.get(
          `http://localhost:8080/api/products/scrape?${params}`
        );

        if (res.status === 200) {
          if (res.data.length === 0) {
            setHasMore(false);
            return;
          }

          setProducts((prev) => [...prev, ...res.data.products]);
          setAvailableFilters(res.data.availableFilters);
        } else throw new Error("An error occurred!");
      } catch (error) {
        console.log(error, error.message);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [appliedParams, currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return;
      const scrolledToBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 20;

      if (scrolledToBottom) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  return (
    <>
      <section className="max-w-[1480px] mx-auto">
        <Navbar />
      </section>
      <section className="max-w-[1480px] mx-auto p-4 min-h-screen">
        {loading && currentPage === 1 ? (
          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-md p-4 space-y-4 animate-pulse w-full"
                >
                  <div className="bg-gray-300 w-full h-60 rounded-md"></div>
                  <div className="bg-gray-300 h-6 rounded-md w-3/4"></div>
                  <div className="bg-gray-300 h-4 rounded-md w-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <main className="relative">
            <div className="flex items-center px-1">
              <h2 className="text-2xl font-medium tracking-tighter flex-1">
                Search results for "{query}"
              </h2>
              <button
                onClick={() => setShowFilters(true)}
                className="uppercase font-semibold text-sm hover:underline cursor-pointer"
              >
                Filters
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <ProductCard key={index} {...{ product }} />
              ))}
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  key="filters"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="overflow-hidden"
                >
                  <FilterWindow
                    filters={availableFilters}
                    setShowFilters={setShowFilters}
                    onApply={() => {
                      setAppliedParams(searchParams.toString());
                      setShowFilters(false);
                    }}
                    onClear={() => {
                      const query = searchParams.get("query");
                      const newParams = new URLSearchParams();
                      if (query) newParams.set("query", query);

                      setAppliedParams(newParams.toString());
                      setShowFilters(false);
                      router.push(`/search?query=${query}`);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        )}
      </section>
    </>
  );
}
