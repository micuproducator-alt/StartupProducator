import React from "react";

export const AdCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-[2rem] border border-stone-200/60 shadow-xl shadow-stone-200/40 flex flex-col h-full animate-pulse">
      <div className="relative h-64 w-full bg-stone-200 rounded-t-[2rem]" />
      <div className="p-8 flex flex-col flex-grow">
        <div className="mb-4">
          <div className="h-6 bg-stone-200 rounded-md w-3/4 mb-2" />
          <div className="h-4 bg-stone-100 rounded-md w-1/2" />
        </div>
        <div className="space-y-2 mb-8">
          <div className="h-4 bg-stone-100 rounded-md w-full" />
          <div className="h-4 bg-stone-100 rounded-md w-5/6" />
        </div>
        <div className="pt-6 border-t border-stone-100 flex items-center justify-between mt-auto">
          <div className="h-6 bg-stone-200 rounded-xl w-16" />
          <div className="h-4 bg-stone-100 rounded-md w-20" />
        </div>
      </div>
    </div>
  );
};
