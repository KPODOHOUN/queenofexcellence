"use client";

import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminPartnersPage() {
  return (
    <AdminCrudPage
      title="Partenaires"
      apiPath="/api/admin/partners"
      itemTitleKey="name"
      itemDescKey="website"
      fields={[
        { key: "name", label: "Nom du partenaire" },
        { key: "website", label: "Site web (URL)", type: "url" },
        { key: "logo", label: "Logo", type: "image", colSpan: 2 },
        { key: "description", label: "Description (optionnel)", type: "textarea", colSpan: 2 },
        { key: "published", label: "Publié (visible sur le site)", type: "boolean", colSpan: 2 },
      ]}
    />
  );
}
