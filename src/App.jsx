import React from "react";
import {
  ThemeProvider,
  ThemeCustomizer,
} from "@/components/providers/ThemeProvider";
import { CustomMDXProvider } from "@/components/providers/MDXProvider";
import { SystemRoutes } from "./src/SystemRoutes"; // ✅ RELATIVE PATH - SystemRoutes.jsx is in same directory as App.jsx

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
