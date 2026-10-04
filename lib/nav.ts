// Mirrors the main site's navbar; links are absolute because this app lives on its own subdomain.
export const SITE_URL = "https://jailbreakchangelogs.com";

export type NavItem = {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: "live";
  wide?: boolean;
};

export type NavSection = { id: string; title: string; icon: string; items: NavItem[] };

const item = (path: string, rest: Omit<NavItem, "href">): NavItem => ({ href: SITE_URL + path, ...rest });

export const NAV: NavSection[] = [
  {
    id: "updates",
    title: "Updates",
    icon: "material-symbols:article-rounded",
    items: [
      item("/changelogs", { icon: "material-symbols:article-rounded", title: "Game Changelogs", description: "Latest Jailbreak updates and patch notes" }),
      item("/changelogs/timeline", { icon: "material-symbols:schedule-rounded", title: "Timeline", description: "A simplified tree view of every update at a glance" }),
    ],
  },
  {
    id: "seasons",
    title: "Seasons",
    icon: "material-symbols:layers-rounded",
    items: [
      item("/seasons", { icon: "material-symbols:layers-rounded", title: "Browse Seasons", description: "Explore all game seasons and rewards" }),
      item("/seasons/leaderboard", { icon: "material-symbols:leaderboard-rounded", title: "Season Leaderboard", description: "See top-ranked players this season" }),
      item("/seasons/contracts", { icon: "material-symbols:task-alt-rounded", title: "Weekly Contracts", description: "Check this week's contracts and plan ahead without launching the game", wide: true }),
    ],
  },
  {
    id: "trading",
    title: "Trading",
    icon: "material-symbols:price-check-rounded",
    items: [
      item("/values", { icon: "material-symbols:price-check-rounded", title: "Value List", description: "Browse item values and market trends" }),
      item("/values/calculator", { icon: "material-symbols:calculate-rounded", title: "Value Calculator", description: "Compare item values before you trade" }),
      item("/items/suggestions", { icon: "material-symbols:lightbulb-outline-rounded", title: "Item Suggestions", description: "Suggest value changes and vote on proposals" }),
      item("/items/changelogs", { icon: "material-symbols:history-rounded", title: "Item Changelogs", description: "See value changes, community votes, and decisions" }),
      item("/trading", { icon: "material-symbols:swap-horiz-rounded", title: "Trade Ads", description: "Browse and post player trade listings", wide: true }),
    ],
  },
  {
    id: "trackers",
    title: "Tools & Trackers",
    icon: "material-symbols:sensors-rounded",
    items: [
      item("/robberies", { icon: "material-symbols:money-bag-rounded", title: "Robbery Tracker", description: "See which robberies and mansions are open right now", badge: "live" }),
      item("/bounties", { icon: "mdi:currency-usd", title: "Bounty Tracker", description: "Find the highest bounty players and join their server", badge: "live" }),
      item("/inventories", { icon: "material-symbols:inventory-2-rounded", title: "Inventory Checker", description: "View any player's full inventory and net worth" }),
      item("/og", { icon: "material-symbols:fingerprint-rounded", title: "OG Finder", description: "Discover who holds the rarest original items" }),
      item("/dupes", { icon: "material-symbols:content-copy-rounded", title: "Dupe Finder", description: "Check if items are duped before you trade" }),
      item("/seasons/will-i-make-it", { icon: "material-symbols:trending-up-rounded", title: "Will I Make It", description: "Enter your level and XP to see if you'll hit level 10 before the season ends" }),
      item("/hyperchrome-pity", { icon: "material-symbols:percent-rounded", title: "Hyperchrome Pity", description: "Estimate robberies until your next Hyperchrome level", wide: true }),
    ],
  },
  {
    id: "community",
    title: "Community",
    icon: "material-symbols:groups-rounded",
    items: [
      item("/users", { icon: "material-symbols:person-search-rounded", title: "User Search", description: "Browse 60k+ Jailbreak Changelogs user profiles" }),
      item("/servers", { icon: "material-symbols:groups-rounded", title: "Private Servers", description: "Find and join private servers" }),
      item("/contributors", { icon: "material-symbols:groups-rounded", title: "Meet the Team", description: "The people behind this site" }),
      item("/testimonials", { icon: "material-symbols:rate-review-rounded", title: "Testimonials", description: "What players say about us" }),
      item("/supporting", { icon: "material-symbols:favorite-rounded", title: "Support Us", description: "Unlock perks like ad removal, custom avatars, and more", wide: true }),
    ],
  },
];
