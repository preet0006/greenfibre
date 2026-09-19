"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Image from "next/image";
import { Sparkles, Box, Leaf } from "lucide-react";

const NEW_MODEL_URL =
  "https://res.cloudinary.com/dsebrpcyz/image/upload/v1789734715/bottle_xg3utw.glb";

export default function Hero3DViewer({
  modelSrc = NEW_MODEL_URL,
  title = "Green Fibre Eco Insulated Bottle",
}) {
  const modelViewerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const is3DModel =
    typeof modelSrc === "string" &&
    (modelSrc.endsWith(".glb") ||
      modelSrc.endsWith(".gltf") ||
      modelSrc.includes(".glb?") ||
      modelSrc.includes(".gltf?"));

  useEffect(() => {
    if (!is3DModel) return;
    const mv = modelViewerRef.current;
    if (!mv) return;
    const onLoad = () => setIsLoaded(true);
    mv.addEventListener("load", onLoad);
    return () => mv.removeEventListener("load", onLoad);
  }, [is3DModel]);

  // 1. Placeholder — no URL configured
  if (!modelSrc) {
    return (
      <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] flex items-center justify-center select-none">
        <div className="relative w-full max-w-[380px] h-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-green-200 bg-white/70 backdrop-blur-sm p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-4 text-green-600 shadow-inner">
            <Box className="h-8 w-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/70 text-green-800 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3 text-green-600" />
            Showcase Ready
          </span>
          <p className="text-xs sm:text-sm text-gray-500 max-w-[240px] leading-relaxed">
            Ready for your 3D model (.glb) or photo URL.
          </p>
        </div>
      </div>
    );
  }

  // 2. Regular 2D Photo / Image
  if (!is3DModel) {
    return (
      <div className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] flex items-center justify-center select-none">
        <div className="relative w-full max-w-[420px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-green-100 bg-white group">
          <Image
            src={modelSrc}
            alt={title}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 420px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4 text-white text-xs sm:text-sm font-medium bg-black/30 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 inline-flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-400 shrink-0" />
            <span className="truncate">{title}</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Interactive 3D Model Viewer
  return (
    <>
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <div className="relative w-full h-[390px] sm:h-[440px] lg:h-[490px] flex items-center justify-center select-none bg-transparent">

        {/* ── Loading animation (4 dots collide → spinner) ── */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div style={{ position: "relative", width: 52, height: 52 }}>

              {/* Top-left dot */}
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                width: 10, height: 10, borderRadius: "50%",
                background: "#16a34a", marginTop: -5, marginLeft: -5,
                animation: "gf-tl 2s cubic-bezier(.4,0,.2,1) infinite",
              }} />

              {/* Top-right dot */}
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                width: 10, height: 10, borderRadius: "50%",
                background: "#22c55e", marginTop: -5, marginLeft: -5,
                animation: "gf-tr 2s cubic-bezier(.4,0,.2,1) infinite",
              }} />

              {/* Bottom-left dot */}
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                width: 10, height: 10, borderRadius: "50%",
                background: "#22c55e", marginTop: -5, marginLeft: -5,
                animation: "gf-bl 2s cubic-bezier(.4,0,.2,1) infinite",
              }} />

              {/* Bottom-right dot */}
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                width: 10, height: 10, borderRadius: "50%",
                background: "#16a34a", marginTop: -5, marginLeft: -5,
                animation: "gf-br 2s cubic-bezier(.4,0,.2,1) infinite",
              }} />

              {/* Collision burst flash */}
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                width: 22, height: 22, borderRadius: "50%",
                background: "#bbf7d0",
                marginTop: -11, marginLeft: -11,
                animation: "gf-burst 2s ease-out infinite",
              }} />

              {/* Spinner ring — appears after collision */}
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                width: 40, height: 40, borderRadius: "50%",
                border: "2.5px solid transparent",
                borderTopColor: "#16a34a",
                borderRightColor: "#86efac",
                marginTop: -20, marginLeft: -20,
                animation: "gf-ring-fade 2s ease infinite, gf-ring-spin 0.75s linear infinite",
              }} />
            </div>

            <style>{`
              /* Dots travel to center then vanish */
              @keyframes gf-tl {
                0%,4%   { transform:translate(-70px,-70px); opacity:0; }
                10%     { transform:translate(-70px,-70px); opacity:1; }
                42%     { transform:translate(0,0);         opacity:1; }
                48%,88% { transform:translate(0,0);         opacity:0; }
                96%,100%{ transform:translate(-70px,-70px); opacity:0; }
              }
              @keyframes gf-tr {
                0%,4%   { transform:translate(70px,-70px);  opacity:0; }
                10%     { transform:translate(70px,-70px);  opacity:1; }
                42%     { transform:translate(0,0);         opacity:1; }
                48%,88% { transform:translate(0,0);         opacity:0; }
                96%,100%{ transform:translate(70px,-70px);  opacity:0; }
              }
              @keyframes gf-bl {
                0%,4%   { transform:translate(-70px,70px);  opacity:0; }
                10%     { transform:translate(-70px,70px);  opacity:1; }
                42%     { transform:translate(0,0);         opacity:1; }
                48%,88% { transform:translate(0,0);         opacity:0; }
                96%,100%{ transform:translate(-70px,70px);  opacity:0; }
              }
              @keyframes gf-br {
                0%,4%   { transform:translate(70px,70px);   opacity:0; }
                10%     { transform:translate(70px,70px);   opacity:1; }
                42%     { transform:translate(0,0);         opacity:1; }
                48%,88% { transform:translate(0,0);         opacity:0; }
                96%,100%{ transform:translate(70px,70px);   opacity:0; }
              }
              /* Green flash on collision */
              @keyframes gf-burst {
                0%,38% { transform:scale(0);   opacity:0; }
                44%    { transform:scale(1.5); opacity:0.55; }
                52%,100%{ transform:scale(0);  opacity:0; }
              }
              /* Spinner fade in/out */
              @keyframes gf-ring-fade {
                0%,48%  { opacity:0; }
                54%     { opacity:1; }
                84%     { opacity:1; }
                94%,100%{ opacity:0; }
              }
              /* Continuous spin */
              @keyframes gf-ring-spin {
                to { transform:rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* ── 3D canvas — always mounted, fades in on load ── */}
        <div
          className="relative w-full h-full flex items-center justify-center bg-transparent"
          style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 0.7s ease" }}
        >
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
              "--progress-bar-height": "0px",
              "--progress-bar-color": "transparent",
              "--progress-mask-color": "transparent",
            }}
          />
        </div>
      </div>
    </>
  );
}
