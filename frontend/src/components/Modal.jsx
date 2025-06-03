import useAuth from "@/hooks/useAuth";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { PiCurrencyInr } from "react-icons/pi";

export default function Modal() {
  const modalRef = useRef();
  const router = useRouter();
  const { auth } = useAuth();
  const { slug } = useParams();
  const privateAxios = useAxiosPrivate();
  const [isOpen, setIsOpen] = useState(false);
  const [threshold, setThreshold] = useState("");

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const addUserToProduct = async () => {
    try {
      await privateAxios.put(`/products/${slug}/subscribe`, {
        threshold: Number(threshold),
      });

      closeModal();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        closeModal();
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <>
      <div className="mt-5">
        <button
          onClick={auth?.user ? openModal : () => router.push("/sign-in")}
          className="w-full active:scale-95 transition-all bg-black text-white rounded-md py-3"
        >
          Track
        </button>
      </div>

      {isOpen && (
        <div className="absolute min-h-screen top-0 left-0 w-full bg-black/50 z-40 flex items-center justify-center">
          <div
            ref={modalRef}
            className="flex flex-col p-5 bg-white w-[450px] rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="relative flex-1 w-36 h-12 -ml-2">
                <Image
                  src="/assets/logo/logo_light_3.png"
                  fill
                  style={{ objectFit: "contain" }}
                  alt="app-logo"
                  className="absolute"
                />
              </div>
            </div>
            <div className="pb-10 mt-2.5 flex-1">
              <h4 className="text-lg font-medium">
                Stay updated with product pricing alerts right in your inbox!
              </h4>
              <p className="mt-1 text-gray-500">
                Never miss a deal again with timely alerts.
              </p>

              <div className="mt-5">
                <div className="border-2 px-2 py-2 mt-2 rounded-md flex items-center space-x-2">
                  <PiCurrencyInr size={20} className="text-gray-400" />
                  <input
                    type="email"
                    value={threshold}
                    placeholder="Threshold (optional)"
                    className="outline-none flex-1"
                    onChange={(e) => setThreshold(e.currentTarget.value)}
                  />
                </div>
              </div>
            </div>
            <div className="bg-black text-white py-3 text-center rounded-md">
              <button
                onClick={addUserToProduct}
                className="active:scale-95 transition-all"
              >
                Start Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
