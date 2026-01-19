import type { LandingScreenProps } from "../types/data_types_interfaces";

export function LandingScreen({
  onUseDemo,
  onLoadUserData,
}: LandingScreenProps) {
  return (
    <div className="w-full h-screen grid place-items-center bg-black">
      <div className="text-center space-y-8 max-w-md">
        {/* Title */}
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          GenomeVis
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-sm">
          An interactive visual analytics interface for exploring reconstructed
          3D genome structures and derived spatial abstractions.
        </p>

        {/* Options */}
        <div className="space-y-4">
          {/* Demo */}
          <button
            onClick={onUseDemo}
            className="w-full px-6 py-3 rounded-lg
                       bg-sky-600 hover:bg-sky-500
                       text-white font-medium transition"
          >
            Use example dataset
          </button>

          <div className="text-xs text-gray-500">
            Explore the interface using precomputed genome structures and shape
            abstractions.
          </div>

          {/* User data */}
          <button
            onClick={onLoadUserData}
            className="w-full px-6 py-3 rounded-lg
                       bg-gray-800 hover:bg-gray-700
                       text-white font-medium transition"
          >
            Load your own data
          </button>

          <div className="text-xs text-gray-500">
            Visualize precomputed MPASE outputs or compatible processed genome
            structure data.
          </div>
        </div>
      </div>
    </div>
  );
}
