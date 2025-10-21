
// AUTO-GENERATED FILE — do not edit manually

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DocLayout } from "@/components/layout/DocLayout";
import navigation from "@/content/meta.json";
import Endpoints from "@/content/api/endpoints.mdx";
import Installation from "@/content/getting-started/installation.mdx";
import Introduction from "@/content/getting-started/introduction.mdx";

export function SystemRoutes() {
  return (
    <Router>
      <DocLayout navigation={navigation.navigation}>
        <Routes>
          <Route path="/api/endpoints" element={<Endpoints />} />
          <Route path="/getting-started/installation" element={<Installation />} />
          <Route path="/getting-started/introduction" element={<Introduction />} />
        </Routes>
      </DocLayout>
    </Router>
  );
}
