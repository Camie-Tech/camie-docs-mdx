// Import your MDX pages (you'll need a bundler plugin for this)
import Introduction from "@/content/getting-started/introduction.mdx";
import Installation from "@/content/getting-started/installation.mdx";
import ApiEndpoints from "@/content/api/endpoints.mdx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DocLayout } from "@/components/layout/DocLayout";
import navigation from "@/content/meta.json";

export function SystemRoutes() {
  return (
    <Router>
      <DocLayout navigation={navigation.navigation}>
        <Routes>
          <Route
            path="/docs/getting-started/introduction"
            element={<Introduction />}
          />
          <Route
            path="/docs/getting-started/installation"
            element={<Installation />}
          />
          <Route path="/docs/api/endpoints" element={<ApiEndpoints />} />
          {/* Add more routes */}
        </Routes>
      </DocLayout>
    </Router>
  );
}
