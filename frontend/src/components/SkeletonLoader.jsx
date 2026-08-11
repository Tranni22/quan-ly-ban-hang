import React from 'react';

export function SkeletonTableCard() {
  return (
    <div className="rounded-2xl p-3 sm:p-4 border border-gray-200 bg-white shadow-2xs animate-pulse flex flex-col justify-between min-h-[160px]">
      <div className="flex items-center justify-between">
        <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
        <div className="h-3 w-8 bg-gray-100 rounded-md"></div>
      </div>

      <div className="my-3 flex flex-col items-center gap-2">
        <div className="h-5 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-3 w-16 bg-gray-100 rounded-md"></div>
      </div>

      <div className="mt-auto pt-2 border-t border-gray-100">
        <div className="h-8 w-full bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );
}

export function SkeletonTableGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTableCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonMenuCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs animate-pulse flex flex-col justify-between">
      <div className="h-28 w-full bg-gray-200"></div>
      <div className="p-3 flex flex-col justify-between gap-2">
        <div className="space-y-1.5">
          <div className="h-4 w-28 bg-gray-200 rounded-md"></div>
          <div className="h-3 w-full bg-gray-100 rounded-md"></div>
        </div>
        <div className="h-8 w-full bg-gray-200 rounded-xl mt-2"></div>
      </div>
    </div>
  );
}

export function SkeletonMenuGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMenuCard key={i} />
      ))}
    </div>
  );
}
