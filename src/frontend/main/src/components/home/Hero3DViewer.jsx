"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

/**
 * Pure 3D Bottle Viewer powered by Google's official <model-viewer> engine.
 * Scaled & framed with comfortable breathing room so the full bottle fits inside the frame.
 */
export default function Hero3DViewer({
  modelSrc = "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789382471/green-fibre-bottle-logo-only_q97ih2.glb",
  title = "Green Fibre Eco Insulated Bottle 3D",
}) {
  const modelViewerRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && customElements.get("model-viewer")) {
      setIsScriptLoaded(true);
    }
  }, []);

  return (
    <>
      {/* Load Google model-viewer asynchronously */}
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />

      <div className="relative w-full h-[390px] sm:h-[440px] lg:h-[490px] flex items-center justify-center select-none bg-transparent">
        {/* Pure 3D Model Canvas */}
        <div className="relative w-full h-full flex items-center justify-center bg-transparent">
          <model-viewer
            ref={modelViewerRef}
            src={modelSrc}
            alt={title}
            loading="eager"
            reveal="auto"
            auto-rotate=""
            auto-rotate-delay="0"
            rotation-per-second="45deg"
            camera-controls=""
            disable-zoom=""
            disable-pan=""
            touch-action="pan-y"
            bounds="tight"
            shadow-intensity="0.8"
            shadow-softness="1"
            environment-image="neutral"
            exposure="1.05"
            camera-orbit="45deg 88deg 100%"
            min-polar-angle="85deg"
            max-polar-angle="90deg"
            interaction-prompt="none"
            ar=""
            ar-modes="webxr scene-viewer quick-look"
            className="w-full h-full outline-none cursor-grab active:cursor-grabbing"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              "--poster-color": "transparent",
            }}
          />
        </div>
      </div>
    </>
  );
}
