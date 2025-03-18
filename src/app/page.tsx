"use client";

import React, { useState, useMemo } from "react";
import { Camera, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const features: FeatureCard[] = useMemo(
    () => [
      {
        id: "screenshot",
        title: "Screenshot Capture",
        description:
          "Capture high-quality screenshots of any website with customizable settings",
        icon: Camera,
        path: "/capture",
        color: "bg-blue-500",
      },
    ],
    []
  );

  const filteredFeatures = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return normalizedSearch
      ? features.filter(
          (feature) =>
            feature.title.toLowerCase().includes(normalizedSearch) ||
            feature.description.toLowerCase().includes(normalizedSearch)
        )
      : features;
  }, [features, searchTerm]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="max-w-6xl mx-auto p-6">
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Developer Toolkit</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Access powerful web tools to streamline your development workflow
          </p>

          <div className="mt-6 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.id}
                onClick={() => handleNavigate(feature.path)}
                className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700 flex"
              >
                <div
                  className={`${feature.color} p-3 rounded-lg mr-4 self-start`}
                >
                  <Icon size={24} />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>

                  <div className="flex items-center text-blue-400 text-sm">
                    Launch tool
                    <ChevronRight size={16} className="ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
