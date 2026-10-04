"use client";

import { useId } from "react";
import { Icon as IconifyIcon, type IconProps } from "@iconify/react";

// ponytail: icons load from the Iconify API at runtime (brief pop-in); bundle them like the main site if that bothers anyone.
function Icon(props: IconProps) {
  // Without an id, Iconify numbers internal <clipPath>/<mask> ids from a
  // global counter that differs between server and client, breaking hydration.
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <IconifyIcon id={id} ssr {...props} />;
}

export { Icon };
