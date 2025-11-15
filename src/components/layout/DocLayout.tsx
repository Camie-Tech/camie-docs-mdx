import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar navigation={navigation} currentPage={currentPage} />
        {/* 🎯 MAIN CHANGE: Removed max-w-4xl, reduced padding, full width */}
        <main className="flex-1 px-8 py-6">
          <article className="prose prose-gray max-w-none dark:prose-invert">
            {children}
          </article>
        </main>
      </div>
    </div>
  );
}
