import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect, useRef } from "react";
import campHtml from "../../public/camp.html?raw";
import { splitCampHtml } from "../camp/mount";

const camp = splitCampHtml(campHtml);

type CampWindow = Window & {
  __CAMP_SCRIPT__?: boolean;
  bootCampApp?: () => void;
};

function installCamp(host: HTMLElement) {
  if (!host.querySelector("#header-brand-logo")) host.innerHTML = camp.body;

  if (!document.querySelector("style[data-camp]")) {
    const style = document.createElement("style");
    style.dataset.camp = "1";
    style.textContent = camp.styles;
    document.head.appendChild(style);
  }

  const w = window as CampWindow;
  if (!w.__CAMP_SCRIPT__) {
    w.__CAMP_SCRIPT__ = true;
    for (const part of camp.scripts) {
      const el = document.createElement("script");
      if (part.module) el.type = "module";
      el.textContent = part.code;
      document.body.appendChild(el);
    }
    return;
  }

  if (typeof w.bootCampApp === "function") w.bootCampApp();
}

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) installCamp(ref.current);
  }, []);

  return (
    <div
      ref={ref}
      className="camp-root pb-24 lg:pb-12"
      dangerouslySetInnerHTML={{ __html: camp.body }}
    />
  );
}
