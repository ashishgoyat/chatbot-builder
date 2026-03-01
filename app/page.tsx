import React from "react";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { CometCard } from "@/components/ui/comet-card";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconBrandGithub,
  IconCoin,
  IconHome,
  IconInfoCircle,
  IconLogin,
  IconUserPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";


export default function DottedGlowBackgroundDemoSecond() {

  const links = [
    {
      title: "Home",
      icon: (
        <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/",
    },

    {
      title: "Login",
      icon: (
        <IconLogin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/login",
    },
    {
      title: "Signup",
      icon: (
        <IconUserPlus className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/signup",
    },
    {
      title: "About Us",
      icon: (
        <IconInfoCircle className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "/about",
    },
    {
      title: "Pricing",
      icon: (
        <IconCoin className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "GitHub",
      icon: (
        <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
      ),
      href: "https://github.com/ashishgoyat",
    },
  ];

  const words = [
    {
      text: "BotForge."
    }
  ]

  return (<>
    <div className="flex items-center justify-between w-full px-8 pt-15">
      <div className="flex items-center  flex-1">
        <TypewriterEffect words={words} />
      </div>
      <div className="flex items-center flex-1">
        <FloatingDock
          items={links}
        />
      </div>
    </div>
    <div className="relative mx-auto flex w-full max-w-7xl items-center justify-center">
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center opacity-20 dark:opacity-100"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      <div className="relative z-10 flex w-full flex-col items-center justify-between space-y-6 px-8 py-16 text-center md:flex-row">
        <div>
          <h2 className="text-center text-4xl font-normal tracking-tight text-neutral-900 sm:text-5xl md:text-left dark:text-neutral-400">
            Ready to build{" "}
            <span className="font-bold dark:text-white">AI Chatbots</span>?
          </h2>
          <p className="mt-4 max-w-lg text-center text-base text-neutral-600 md:text-left dark:text-neutral-300">
            Upload your docs, FAQs, or product info. BotForge trains an AI chatbot that answers your customers instantly — and embed it on any website in seconds.
          </p>
          <div className="mt-4">
            <Link href={"/signup"} className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                Start Building for Free ...
              </span>
            </Link>
          </div>
        </div>
      </div>
      <CometCard>
        <button
          type="button"
          className="my-10 flex w-80 cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 saturate-0 md:my-20 md:p-4"
          aria-label="View invite F7RA"
          style={{
            transformStyle: "preserve-3d",
            transform: "none",
            opacity: 1,
          }}
        >
          <div className="mx-2 flex-1">
            <div className="relative mt-2 aspect-[3/4] w-full">
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-[16px] bg-[#000000] object-cover contrast-75"
                alt="Invite background"
                src="/vercel.svg"
                width={300}
                height={400}
                style={{
                  boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                  opacity: 1,
                }}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-shrink-0 items-center justify-between p-4 font-mono text-white">
            <div className="text-xs">

            </div>
            <div className="text-xs text-gray-300 opacity-50">BotForge</div>
          </div>
        </button>
      </CometCard>
    </div>
  </>
  );
}