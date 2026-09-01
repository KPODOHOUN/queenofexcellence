"use client";

import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminProjectsPage() {
  return (
    <AdminCrudPage
      title="Projets"
      apiPath="/api/admin/projects"
      fields={[
        { key: "title", label: "Titre" },
        { key: "description", label: "Description", type: "textarea", colSpan: 2 },
        { key: "image", label: "Image", type: "image", colSpan: 2 },
        { key: "published", label: "Publié (visible sur le site)", type: "boolean", colSpan: 2 },
      ]}
    />
  );
}
