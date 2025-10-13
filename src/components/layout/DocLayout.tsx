import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
// import { TableOfContents } from "./TableOfContents";

interface DocLayoutProps {
  children: React.ReactNode;
  navigation: any[];
  currentPage?: string;
}

export function DocLayout({
  children,
  navigation,
  currentPage,
}: DocLayoutProps) {
  return (
    <div className="min-h-screen bg-background min-w-full">
      <Header />
      <div className="flex">
        <Sidebar navigation={navigation} currentPage={currentPage} />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-8">
          <article className="prose prose-gray max-w-none">{children}</article>
        </main>
        {/* <TableOfContents /> */}
      </div>
    </div>
  );
}
