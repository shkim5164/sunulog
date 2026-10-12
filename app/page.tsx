import { getPostsSummary } from "@/lib/posts";
import LibraryHome from "@/components/LibraryHome";
import { getSiteSettings } from "@/lib/site";

export default function Home() {
  return (
    <LibraryHome summaries={getPostsSummary()} settings={getSiteSettings()} />
  );
}
