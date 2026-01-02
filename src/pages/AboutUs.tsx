import { useEffect, useState } from "react";
import { Skeleton } from "../components/ui/skeleton";

export default function AboutUs() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for skeleton
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 py-4 md:px-16 lg:px-24 xl:px-32">
        <div className="text-center mb-12 pt-24">
          <h1 className="text-4xl/17 md:text-5xl/20 font-semibold text-gray-900">About Us</h1>
          <p className="text-base text-gray-500 max-w-md mx-auto mt-4">
            Learn more about our mission, values, and the team behind our innovative solutions
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {/* Loading skeleton for sections */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6">ℹ️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Us</h2>
              <p className="text-gray-700 mb-6">
                We're working hard to bring you an amazing About Us page. Please check back later for more information!
              </p>
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800">
                Coming Soon
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
