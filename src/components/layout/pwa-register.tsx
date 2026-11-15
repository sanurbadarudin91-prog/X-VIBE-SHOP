"use client";

import { useEffect } from "react";

/** Daftarkan service worker + tampilkan splash singkat saat aplikasi dibuka. */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Splash screen singkat agar terasa seperti aplikasi mobile native.
    const splash = document.getElementById("xvs-splash");
    if (splash) {
      const timer = window.setTimeout(() => {
        splash.classList.add("opacity-0");
        window.setTimeout(() => splash.remove(), 400);
      }, 900);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Daftarkan setelah halaman siap agar tidak menghambat render awal.
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
