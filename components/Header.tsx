"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { NavigationMenu } from "radix-ui";
import { Icon } from "@/components/ui/IconWrapper";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggler } from "@/components/ThemeToggler";
import { cn } from "@/lib/utils";
import { NAV, SITE_URL, type NavItem } from "@/lib/nav";

// Ported from the main site's Header + NavbarModern, minus auth, notifications,
// messages and tickers (the status page has no login).

const NavDropdownItem = ({ href, icon, title, description, badge, wide }: NavItem) => (
  <a
    href={href}
    className={cn(
      "focus-visible:ring-link hover:bg-tertiary-bg flex items-start gap-3 rounded-md px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none",
      wide && "col-span-2",
    )}
  >
    <Icon icon={icon} className="text-primary-text mt-0.5 h-5 w-5 shrink-0" inline={true} />
    <div className="min-w-0 flex-1">
      <div className="text-primary-text flex flex-wrap items-center gap-1.5 text-sm leading-tight font-semibold transition-colors">
        {title}
        {badge && (
          <span className="bg-button-info/20 text-link rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
            Live
          </span>
        )}
      </div>
      <div className="text-secondary-text mt-0.5 text-xs leading-relaxed">{description}</div>
    </div>
  </a>
);

const Logo = ({ className }: { className: string }) => (
  <a href={SITE_URL} className="block" aria-label="Jailbreak Changelogs home">
    <Image
      src="/logos/JBCL_Long_Transparent.webp"
      alt="Jailbreak Changelogs Logo"
      width={256}
      height={58}
      quality={90}
      priority
      className={className}
    />
  </a>
);

function DesktopNav() {
  const [value, setValue] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Centre the dropdown under whichever trigger is open.
  useEffect(() => {
    const trigger = triggerRefs.current[value];
    if (!trigger || !rootRef.current || !viewportContainerRef.current) return;
    const t = trigger.getBoundingClientRect();
    const r = rootRef.current.getBoundingClientRect();
    viewportContainerRef.current.style.left = `${t.left - r.left + t.width / 2}px`;
  }, [value]);

  // ponytail: Radix's default hover-close replaces the main site's safe-triangle tracking; port it if menus feel twitchy.
  return (
    <div ref={rootRef} className="absolute left-1/2 -translate-x-1/2">
      <NavigationMenu.Root style={{ position: "relative" }} delayDuration={0} value={value} onValueChange={setValue}>
        <NavigationMenu.List className="m-0 flex list-none items-center gap-2 p-0">
          {NAV.map((section) => (
            <NavigationMenu.Item key={section.id} value={section.id}>
              <NavigationMenu.Trigger
                ref={(el) => {
                  triggerRefs.current[section.id] = el;
                }}
                className="group text-primary-text hover:border-secondary-text data-[state=open]:border-primary-text focus-visible:ring-link flex h-15 cursor-pointer items-center gap-1 border-b-2 border-transparent pr-2 pl-3 font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
              >
                {section.title}
                <Icon
                  icon="mdi:chevron-down"
                  className="text-secondary-text group-data-[state=open]:text-primary-text h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
                  inline={true}
                />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content style={{ position: "absolute", top: 0, left: 0 }} onClick={() => setValue("")}>
                <div className="grid w-[540px] grid-cols-2 gap-1 p-2">
                  {section.items.map((i) => (
                    <NavDropdownItem key={i.href} {...i} />
                  ))}
                </div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ))}
          <NavigationMenu.Indicator
            style={{
              position: "absolute",
              top: "100%",
              zIndex: 1,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              height: "10px",
              overflow: "hidden",
              transition: "width 250ms ease, transform 250ms ease",
            }}
          >
            <svg width="11" height="5" viewBox="0 0 11 5" className="fill-border-primary">
              <path d="M0,5 L5.5,0 L11,5 Z" />
            </svg>
          </NavigationMenu.Indicator>
        </NavigationMenu.List>

        <div
          ref={viewportContainerRef}
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
            perspective: "2000px",
          }}
        >
          <NavigationMenu.Viewport
            className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            style={{
              position: "relative",
              transformOrigin: "top center",
              marginTop: "10px",
              width: "var(--radix-navigation-menu-viewport-width)",
              height: "var(--radix-navigation-menu-viewport-height)",
              transition: "height 100ms ease",
              overflow: "hidden",
              borderRadius: "8px",
              border: "1px solid var(--color-border-card)",
              backgroundColor: "var(--color-secondary-bg)",
            }}
          />
        </div>
      </NavigationMenu.Root>
    </div>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const [openSection, setOpenSection] = useState("updates");
  return (
    <div className="border-border-card flex h-full flex-col border-t">
      {NAV.map((section) => {
        const open = openSection === section.id;
        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setOpenSection(open ? "" : section.id)}
              aria-expanded={open}
              className="hover:bg-tertiary-bg focus-visible:bg-tertiary-bg focus-visible:ring-link flex min-h-11 w-full items-center justify-between border-l-2 border-transparent py-2.5 pr-4 pl-3.5 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
            >
              <div className="flex items-center gap-2.5">
                <Icon icon={section.icon} className="text-primary-text h-5 w-5 shrink-0" inline={true} />
                <span className="text-primary-text text-sm font-semibold">{section.title}</span>
              </div>
              <Icon
                icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="text-secondary-text h-4 w-4 transition-colors duration-200"
                inline={true}
              />
            </button>
            {open && (
              <div className="pb-1">
                {section.items.map((i) => (
                  <a
                    key={i.href}
                    href={i.href}
                    onClick={onClose}
                    className="hover:bg-tertiary-bg focus-visible:bg-tertiary-bg focus-visible:ring-link flex min-h-11 items-center gap-2.5 py-2 pr-3 pl-10 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <Icon icon={i.icon} className="text-primary-text h-5 w-5 shrink-0" inline={true} />
                    <span className="text-primary-text min-w-0 flex-1 truncate text-sm">{i.title}</span>
                    {i.badge && (
                      <span className="bg-button-info/20 text-link ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                        Live
                      </span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop navbar */}
      <div className="sticky top-0 z-1300 hidden xl:block" style={{ viewTransitionName: "navbar" }}>
        <div className="bg-secondary-bg border-border-card border-b">
          <div className="relative flex h-15 items-center justify-between px-4">
            <Logo className="h-10 w-auto" />
            <DesktopNav />
            <ThemeToggler className="focus-visible:ring-link data-[state=open]:bg-quaternary-bg border-0 bg-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none" />
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-1400 block xl:hidden" style={{ viewTransitionName: "navbar-mobile" }}>
        <div className="bg-secondary-bg border-border-card border-b">
          <div className="flex items-center justify-between px-4 py-2">
            <Logo className="h-9 w-auto sm:h-12" />
            <div className="flex items-center gap-2">
              <ThemeToggler
                size="sm"
                className="focus-visible:ring-link data-[state=open]:bg-quaternary-bg border-0 bg-transparent transition-colors focus-visible:ring-2 focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="hover:bg-quaternary-bg focus-visible:ring-link flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
              >
                <svg className="text-primary-text h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                  <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            overlayClassName="animation-duration-400 ease-in-out motion-reduce:animate-none"
            className="bg-secondary-bg animation-duration-800 fill-mode-both w-72 overflow-y-auto p-0 backdrop-blur-none transition-none ease-in-out will-change-transform motion-reduce:animate-none"
          >
            <div className="p-3">
              <Logo className="h-9 w-auto" />
            </div>
            <MobileDrawer onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
