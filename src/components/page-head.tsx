"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/stores/use-app-store";

interface PageHeadProps {
  title: string;
  description: string;
}

export function PageHead({ title, description }: PageHeadProps) {
  const { name, logoUrl, description: appDescription, loaded } = useAppStore();

  useEffect(() => {
    if (!loaded) return;

    // Update document title
    const fullTitle = `${title} | ${name}`;
    document.title = fullTitle;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", appDescription || description);

    // Update OG tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", fullTitle);

    let ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute(
      "content",
      appDescription || description
    );

    // Update OG image if logo exists
    if (logoUrl) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute("content", logoUrl);
    }
  }, [loaded, name, logoUrl, appDescription, title, description]);

  return null;
}
