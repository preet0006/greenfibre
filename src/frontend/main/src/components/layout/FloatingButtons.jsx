"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import usePageSettingsStore from "@/store/usePageSettingsStore";
import { ArrowUp, MessageCircle } from "lucide-react";

// WhatsApp SVG icon (official brand color)
function WhatsAppIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const DEFAULT_MESSAGE = "Hi! I'm interested in your products. Can you help me?";

const btnBase =
  "flex items-center justify-center rounded-full shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export default function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);
  const whatsappNumber = usePageSettingsStore((s) => s.settings.whatsappNumber);

  // Show back-to-top after scrolling 300px
  useEffect(() => {
    const fn = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`
    : null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex items-end justify-between px-5">
      {/* ── WhatsApp — left ── */}
      <AnimatePresence>
        {whatsappHref && (
          <motion.a
            key="whatsapp"
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            initial={{ opacity: 0, scale: 0.5, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.93 }}
            className={`${btnBase} pointer-events-auto h-14 w-14 bg-[#25d366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] focus-visible:ring-[#25d366]`}
          >
            <WhatsAppIcon className="h-7 w-7" />

            {/* Pulse ring */}
            <motion.span
              className="absolute h-14 w-14 rounded-full bg-[#25d366] opacity-0"
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </motion.a>
        )}

        {/* placeholder so back-to-top stays right even without WhatsApp */}
        {!whatsappHref && <span className="h-14 w-14" />}
      </AnimatePresence>

      {/* ── Back to top — right ── */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="back-to-top"
            onClick={scrollToTop}
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0.5, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.93 }}
            className={`${btnBase} pointer-events-auto h-12 w-12 border border-[#15803d]/15 bg-white text-[#15803d] shadow-[0_4px_20px_rgba(67,15,81,0.14)] focus-visible:ring-[#15803d]`}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
