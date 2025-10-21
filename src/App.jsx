import React from "react";
import {
  ThemeProvider,
  ThemeCustomizer,
} from "@/components/providers/ThemeProvider";
import { CustomMDXProvider } from "@/components/providers/MDXProvider";
import { SystemRoutes } from "./SystemRoutes";

function App() {
  return (
    <ThemeProvider>
      <CustomMDXProvider>
        <SystemRoutes />
        {/* Theme Customizer - remove in production */}
        {import.meta.env.DEV && <ThemeCustomizer />}
      </CustomMDXProvider>
    </ThemeProvider>
  );
}

export default App;
