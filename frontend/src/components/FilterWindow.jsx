"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FilterWindow({
  filters,
  setShowFilters,
  onApply,
  onClear,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!filters) return null;

  const handleFilterChange = (filterKey, value, checked) => {
    const params = new URLSearchParams(searchParams.toString());
    const raw = params.get(filterKey) || "";
    const existing = raw.split("|").filter(Boolean);

    let updatedValues;

    if (checked) {
      updatedValues = existing.includes(value)
        ? existing
        : [...existing, value];
    } else {
      updatedValues = existing.filter((v) => v !== value);
    }

    if (updatedValues.length > 0) {
      params.set(filterKey, updatedValues.join("|"));
    } else {
      params.delete(filterKey);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="absolute top-0 left-0 w-full h-[calc(100vh-100px)] bg-[#FBFBFB] flex flex-col pb-14 overflow-y-auto">
      <div className="flex-1">
        <div className="space-y-4 px-4 pt-6">
          {Object.entries(filters).map(([filterKey, values]) => (
            <div key={filterKey}>
              <h4 className="uppercase text-2xl tracking-tighter mb-4">
                {filterKey}
              </h4>
              <div className="flex flex-col gap-4">
                {values.map((value) => {
                  const raw = searchParams.get(filterKey) || "";
                  const selectedValues = raw.split("|");
                  const checked = selectedValues.includes(value);

                  return (
                    <label
                      key={value}
                      className="flex items-center gap-2 uppercase text-xs"
                    >
                      <input
                        type="checkbox"
                        name={filterKey}
                        value={value}
                        checked={checked}
                        onChange={(e) =>
                          handleFilterChange(filterKey, value, e.target.checked)
                        }
                        className="w-4 h-4 border-2 border-black rounded-sm cursor-pointer appearance-none checked:bg-black checked:border-black"
                      />
                      {value}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-10 p-4 mt-5 border-t border-gray-200">
        <button
          onClick={onClear}
          className="uppercase font-semibold text-sm hover:underline cursor-pointer"
        >
          Clear All
        </button>
        <button
          onClick={onApply}
          className="uppercase font-semibold text-sm hover:underline cursor-pointer"
        >
          Apply
        </button>
        <button
          onClick={() => setShowFilters(false)}
          className="uppercase font-semibold text-sm hover:underline cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
