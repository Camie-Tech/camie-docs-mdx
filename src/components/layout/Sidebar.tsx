import React from "react";
import { NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";

interface NavItem {
  title: string;
  href?: string;
  children?: NavItem[];
}

interface SidebarProps {
  navigation: NavItem[];
  currentPage?: string;
}

export function Sidebar({ navigation, currentPage }: SidebarProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set()
  );

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedSections(newExpanded);
  };

  // Recursive function to render navigation items (supports unlimited nesting)
  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.title);
    const indentClass = level > 0 ? `ml-${level * 4}` : "";

    if (hasChildren) {
      return (
        <div key={item.title} className={indentClass}>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto"
            onClick={() => toggleSection(item.title)}
          >
            <span className={level === 0 ? "font-medium" : "font-normal text-sm"}>
              {item.title}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {isExpanded && (
            <div className="ml-4 mt-2 space-y-1">
              {item.children!.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf node with href
    if (item.href) {
      return (
        <Button
          key={item.href}
          variant={currentPage === item.href ? "secondary" : "ghost"}
          className={`w-full justify-start p-2 h-auto text-sm ${indentClass}`}
          asChild
        >
          <NavLink to={item.href}>{item.title}</NavLink>
        </Button>
      );
    }

    // Fallback for items without href or children
    return (
      <div key={item.title} className={`p-2 text-sm text-muted-foreground ${indentClass}`}>
        {item.title}
      </div>
    );
  };

  return (
    <aside className="w-64 h-screen sticky top-0 border-r bg-card p-4 overflow-y-auto">
      <div className="space-y-2">
        {navigation.map((section) => renderNavItem(section))}
      </div>
    </aside>
  );
}
