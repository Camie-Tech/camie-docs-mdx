import React from "react";
import {
  ThemeProvider,
  ThemeCustomizer,
} from "@/components/providers/ThemeProvider";
import { CustomMDXProvider } from "@/components/providers/MDXProvider";
import { SystemRoutes } from "./SystemRoutes"; // ✅ RELATIVE PATH - SystemRoutes.jsx is in same directory as App.jsx
import { AIProvider } from "@/components/providers/AIProvider";
import { AIFloatingButton } from "@/components/ui/AIFloatingButton";

function App() {
  return (
    <ThemeProvider>
      <CustomMDXProvider>
        <AIProvider>
          <SystemRoutes />

          {/* Global AI Features are now managed within AIProvider/Components */}
          <AIFloatingButton />
        </AIProvider>

        {/* Theme Customizer - remove in production */}
        {import.meta.env.DEV && <ThemeCustomizer />}
      </CustomMDXProvider>
    </ThemeProvider>
  );
}

export default App;
