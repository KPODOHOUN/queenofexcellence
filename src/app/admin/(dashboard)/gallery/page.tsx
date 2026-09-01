"use client";

import { AdminCrudPage } from "@/components/admin/AdminCrudPage";

export default function AdminGalleryPage() {
  return (
    <AdminCrudPage
      title="Galerie"
      apiPath="/api/admin/gallery"
      fields={[
        { key: "title", label: "Titre" },
        { key: "imageUrl", label: "Image", type: "image", colSpan: 2 },
        { key: "category", label: "Catégorie" },
        { key: "published", label: "Publié (visible sur le site)", type: "boolean", colSpan: 2 },
      ]}
    />
  );
}
