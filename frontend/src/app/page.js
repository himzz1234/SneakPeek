"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import { publicAxios } from "@/lib/axios";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [topDeals, setTopDeals] = useState([]);
  const [trendingDeals, setTrendingDeals] = useState([]);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      const [bestDealsResult, trendingDealsResult] = await Promise.all([
        publicAxios.get("/products/deals/best"),
        publicAxios.get("/products/deals/trending"),
      ]);

      setTopDeals(bestDealsResult.data.products);
      setTrendingDeals(trendingDealsResult.data.products);
      setLoading(false);
    };

    fetchDeals();
  }, []);

  return (
    <>
      <header className="max-w-[1480px] mx-auto px-4">
        <Navbar />
      </header>

      <main className="max-w-[1480px] mx-auto px-4">
        <section className="relative w-full h-[500px] mt-6 rounded-xl overflow-hidden">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 2000, disableOnInteraction: false }}
            loop={true}
            className="w-full h-full"
          >
            {[
              "/assets/banner_4.webp",
              "/assets/banner_5.webp",
              "/assets/banner_6.webp",
            ].map((src, idx) => (
              <SwiperSlide key={idx}>
                <Image
                  src={src}
                  fill
                  className="object-cover object-center"
                  alt={`banner-${idx}`}
                  priority
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        <section className="py-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-6 capitalize">
              Top Deals on Sneakers
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, index) => (
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
            ) : (
              <Swiper
                slidesPerView={5}
                spaceBetween={20}
                grabCursor={true}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                }}
              >
                {topDeals.map((product) => (
                  <SwiperSlide key={product._id}>
                    <ProductCard product={product} showLowestPrice />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight mb-6 capitalize">
              Trending Sneakers
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, index) => (
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
            ) : (
              <Swiper
                slidesPerView={5}
                spaceBetween={20}
                grabCursor={true}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 4 },
                }}
              >
                {trendingDeals.map((product) => (
                  <SwiperSlide key={product._id}>
                    <ProductCard product={product} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
