import React from "react";
import { Header } from "./Header";
import { BottomNavigationBar } from "./BottomNavigationBar";

interface PageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showHeader = true,
  showBottomNav = true,
}) => {
  return (
    <div className="min-h-screen bg-kiya-dark flex flex-col">
      {showHeader && <Header />}

      <main className={`flex-1 ${showBottomNav ? "pb-16" : ""}`}>
        {children}
      </main>

      {showBottomNav && <BottomNavigationBar />}
    </div>
  );
};
