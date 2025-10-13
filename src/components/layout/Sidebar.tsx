import React from "react";
import { NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown } from "lucide-react";

interface SidebarProps {
  navigation: Array<{
    title: string;
    href?: string;
    children?: Array<{ title: string; href: string }>;
  }>;
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

  return (
    <aside className="w-64 h-screen sticky top-0 border-r bg-card p-4 overflow-y-auto">
      <div className="space-y-2">
        {navigation.map((section) => (
          <div key={section.title}>
            {section.children ? (
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto"
                  onClick={() => toggleSection(section.title)}
                >
                  <span className="font-medium">{section.title}</span>
                  {expandedSections.has(section.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {expandedSections.has(section.title) && (
                  <div className="ml-4 mt-2 space-y-1">
                    {section.children.map((item) => (
                      <Button
                        key={item.href}
                        variant={
                          currentPage === item.href ? "secondary" : "ghost"
                        }
                        className="w-full justify-start p-2 h-auto text-sm"
                        asChild
                      >
                        <NavLink to={item.href}>{item.title}</NavLink>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant={currentPage === section.href ? "secondary" : "ghost"}
                className="w-full justify-start p-2 h-auto"
                asChild
              >
                <a href={section.href}>{section.title}</a>
              </Button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
