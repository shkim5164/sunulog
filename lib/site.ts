import fs from "fs";
import path from "path";
import { imageSource } from "@/lib/media";

export interface SiteSettings {
  heroImage: string;
  heroAlt: string;
  introduction: string;
  imagePosition: number;
}

export function getSiteSettings(): SiteSettings {
  const settings = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data/site.json"), "utf8"),
  );
  return {
    heroImage: imageSource(settings.heroImage) || "/images/reading-window.jpg",
    heroAlt:
      typeof settings.heroAlt === "string" ? settings.heroAlt : "창가의 책",
    introduction:
      typeof settings.introduction === "string"
        ? settings.introduction
        : "오늘도, 한 장의 기록.",
    imagePosition: Number.isFinite(settings.imagePosition)
      ? Math.max(0, Math.min(100, settings.imagePosition))
      : 50,
  };
}
