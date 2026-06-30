"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "QuickEasy Lift Parts",
    subtitle: "Quick Delivery · Easy Service · Zero Downtime",
    desc: "Professional elevator parts supplier — Door Systems, Control Systems, Traction Systems, and more.",
  },
  {
    title: "Quality Elevator Components",
    subtitle: "All Major Brands Covered",
    desc: "Otis, Kone, Schindler, Mitsubishi, ThyssenKrupp — we stock parts for all leading elevator manufacturers.",
  },
  {
    title: "Global Shipping",
    subtitle: "Fast & Reliable Delivery",
    desc: "Most orders processed within 24 hours. Worldwide shipping with tracking available.",
  },
];

export default function HeroCarousel() {
  return (
    <Swiper
      modules={[Autoplay, Navigation, Pagination]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      navigation
      pagination={{ clickable: true }}
      loop
      className="relative h-[500px] md:h-[600px]"
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>
          <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
              <p className="mb-2 text-sm uppercase tracking-[0.2em] text-slate-400">{slide.subtitle}</p>
              <h1 className="mb-4 text-4xl font-bold text-white md:text-6xl">{slide.title}</h1>
              <p className="mx-auto mb-10 max-w-2xl text-base text-slate-300 md:text-lg">{slide.desc}</p>
              <div className="flex items-center justify-center gap-4">
                <Button size="lg" asChild className="bg-white text-slate-900 hover:bg-slate-100 px-8">
                  <Link href="/products">View Products</Link>
                </Button>
                <Button size="lg" asChild
                  className="border-2 border-white/40 bg-transparent text-white hover:bg-white/10 px-8">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
