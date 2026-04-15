"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";

import { AppIcon } from "~/components/app-icon";
import { InitialAvatar } from "~/components/initial-avatar";

type UserMenuProps = {
  name?: string | null;
  image?: string | null;
};

export function UserMenu(props: UserMenuProps) {
  return (
    <details className="group relative">
      <summary className="list-none rounded-full p-0 ring-offset-2 ring-offset-[#0c0e17] transition-colors outline-none hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-[#83aeff]">
        {props.image ? (
          <Image
            src={props.image}
            alt="Profile"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full border border-white/20 object-cover"
          />
        ) : (
          <InitialAvatar
            name={props.name}
            className="h-9 w-9 border border-white/20"
            textClassName="text-sm font-black text-[#0c0e17]"
          />
        )}
      </summary>

      <div className="absolute right-0 z-50 mt-3 w-48 overflow-hidden rounded-xl border border-[#464752]/20 bg-[#11131d] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
        <Link
          href="/satin-alimlarim"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#e6e8f2] transition-colors hover:bg-white/10"
        >
          <AppIcon name="confirmation_number" className="h-4 w-4" />
          Biletlerim
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#ffb2aa] transition-colors hover:bg-[#430d12]"
        >
          <AppIcon name="person" className="h-4 w-4" />
          Cikis yap
        </button>
      </div>
    </details>
  );
}
