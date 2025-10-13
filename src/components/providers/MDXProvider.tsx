import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { mdxComponents } from "@/components/mdx";

export function CustomMDXProvider({ children }: { children: React.ReactNode }) {
  return <MDXProvider components={mdxComponents}>{children}</MDXProvider>;
}
