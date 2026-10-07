"use client";

import { useId } from "react";
import { Icon as IconifyIcon, type IconProps } from "@iconify/react";

function Icon(props: IconProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return <IconifyIcon id={id} ssr {...props} />;
}

export { Icon };
