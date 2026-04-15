"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

type MainNavLinksProps = {
  className?: string;
};

const items = [
  { href: "/", label: "Etkinlikler" },
  { href: "/satin-alimlarim", label: "Biletlerim" },
  { href: "/explore", label: "Kesfet" },
  { href: "/calendar", label: "Takvim" },
] as const;

export function MainNavLinks(props: MainNavLinksProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className={props.className}>
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <button
            key={item.href}
            type="button"
            onClick={() => {
              if (pathname === item.href) return;
              startTransition(() => {
                router.push(item.href);
              });
            }}
            className={[
              "pb-1 font-medium transition-all",
              active
                ? "border-b-2 border-blue-400 text-blue-400"
                : "text-slate-400 hover:text-blue-300",
              isPending ? "animate-pulse opacity-70" : "opacity-100",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
