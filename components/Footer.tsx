import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SITE_URL } from "@/lib/nav";

const SOCIALS = [
  { href: "https://x.com/JBChangelogs", icon: "prime:twitter", label: "Twitter/X", tip: "Follow us on X (Twitter)" },
  { href: "https://discord.jailbreakchangelogs.com", icon: "ic:baseline-discord", label: "Discord", tip: "Join our Discord server" },
  { href: "https://www.roblox.com/communities/35348206/Jailbreak-Changelogs#!/about", icon: "simple-icons:roblox", label: "Roblox Group", tip: "Join our Roblox group" },
  { href: "https://bsky.app/profile/jbchangelogs.bsky.social", icon: "ri:bluesky-fill", label: "Bluesky", tip: "Follow us on Bluesky" },
  { href: `${SITE_URL}/supporting`, icon: "heroicons:heart-solid", label: "Support Us", tip: "Support Us" },
  { href: "https://github.com/JBChangelogs/JailbreakChangelogs", icon: "mdi:github", label: "View on GitHub", tip: "View on GitHub" },
  { href: "https://www.youtube.com/@JailbreakChangelogs", icon: "mdi:youtube", label: "YouTube", tip: "Subscribe on YouTube" },
];

const COLUMNS = [
  {
    title: "Resources",
    links: [
      { href: "https://jailbreak.fandom.com/wiki/Jailbreak_Wiki:Home", label: "Jailbreak Wiki" },
      { href: `${SITE_URL}/faq`, label: "FAQ" },
      { href: `${SITE_URL}/bot`, label: "Discord Bot" },
      { href: `${SITE_URL}/dev/changelogs`, label: "Dev Changelogs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: `${SITE_URL}/privacy`, label: "Privacy Policy" },
      { href: `${SITE_URL}/tos`, label: "Terms of Service" },
      { href: "mailto:support@jailbreakchangelogs.com", label: "Contact Us" },
    ],
  },
];

const linkClass = "text-link hover:text-link-hover active:text-link-active transition-colors duration-200";

export default function Footer() {
  return (
    <footer className="border-border-card bg-secondary-bg w-full border-t">
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-8 md:px-10 md:pt-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_0.85fr_1.3fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <a href={SITE_URL} className="inline-block" aria-label="Jailbreak Changelogs home">
              <Image src="/logos/JBCL_Long_Transparent.webp" alt="Jailbreak Changelogs" width={256} height={58} className="h-auto w-56" />
            </a>
            <p className="text-secondary-text mt-4 max-w-xs text-sm leading-relaxed">
              Jailbreak updates, values, and community tools in one place.
            </p>
            <div className="mt-6 -ml-1.5 flex flex-wrap items-center gap-1">
              {SOCIALS.map((s) => (
                <Tooltip key={s.label}>
                  <TooltipTrigger asChild>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link hover:bg-quaternary-bg hover:text-link-hover rounded-full p-1.5 transition-colors duration-200"
                      aria-label={s.label}
                    >
                      <Icon icon={s.icon} className="text-primary-text h-5 w-5" inline={true} />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>{s.tip}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <h3 className="text-secondary-text/70 text-xs font-semibold tracking-[0.16em] uppercase">{col.title}</h3>
              <div className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <a key={l.label} href={l.href} className={`${linkClass} block`}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-4">
            <h3 className="text-secondary-text/70 text-xs font-semibold tracking-[0.16em] uppercase">About</h3>
            <div className="space-y-2">
              <p className="text-secondary-text">This project is NOT affiliated with Badimo.</p>
              <p className="text-secondary-text text-sm leading-relaxed">
                Crafted with <Icon icon="line-md:heart-filled" className="text-link inline h-4 w-4" inline={true} /> by{" "}
                <a href={`${SITE_URL}/users/659865209741246514`} className={`${linkClass} hover:underline`}>
                  Jakobiis
                </a>{" "}
                &amp;{" "}
                <a href={`${SITE_URL}/users/1019539798383398946`} className={`${linkClass} hover:underline`}>
                  Jalenzz16
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-border-card mt-8 border-t pt-6">
          <p className="text-secondary-text text-xs leading-relaxed">
            &copy; 2024 -&nbsp;{new Date().getFullYear()} Jailbreak Changelogs LLC. Jailbreak Changelogs, JBCL, and any
            associated logos are trademarks, service marks, and/or registered trademarks of Jailbreak Changelogs LLC.
          </p>
        </div>
      </div>
    </footer>
  );
}
