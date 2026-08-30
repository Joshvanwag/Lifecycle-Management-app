"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { mainNavigation } from "@/config/navigation";
import { PageLoadingIndicator } from "@/components/layout/page-loading-indicator";

interface NavigationPendingContextValue {
  pendingHref: string | null;
  beginNavigation: (href: string) => void;
}

const NavigationPendingContext = createContext<NavigationPendingContextValue | null>(null);

function currentLocation(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function locationFromHref(href: string) {
  const url = new URL(href, window.location.origin);
  return currentLocation(url.pathname, url.search.replace(/^\?/, ""));
}

export function pathMatchesHref(href: string, path: string) {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}

function labelForHref(href: string) {
  const path = href.split("?")[0] ?? href;
  const items = mainNavigation.flatMap((group) => group.items);
  const exact = items.find((item) => item.href === path);
  if (exact) return exact.title;
  const nested = items.find((item) => item.href !== "/" && path.startsWith(`${item.href}/`));
  return nested?.title ?? "Loading";
}

export function NavigationPendingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const current = currentLocation(pathname, search);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [current]);

  const beginNavigation = useCallback(
    (href: string) => {
      const next = locationFromHref(href);
      if (next !== current) {
        setPendingHref(next);
      }
    },
    [current],
  );

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      beginNavigation(href);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [beginNavigation]);

  return (
    <NavigationPendingContext.Provider value={{ pendingHref, beginNavigation }}>
      {children}
    </NavigationPendingContext.Provider>
  );
}

export function useActivePath() {
  const pathname = usePathname();
  const pendingHref = useContext(NavigationPendingContext)?.pendingHref;
  return pendingHref?.split("?")[0] ?? pathname;
}

export function NavigationPendingOutlet({ children }: { children: React.ReactNode }) {
  const pendingHref = useContext(NavigationPendingContext)?.pendingHref;
  if (!pendingHref) return children;
  return <PageLoadingIndicator label={`Loading ${labelForHref(pendingHref)}`} />;
}
