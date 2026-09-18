import Link from "next/link";
import { ArrowLeft, Images } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getServerDictionary } from "@/lib/i18n/serverLocale";
import { getSignedPhotoUrls } from "@/lib/actions/photo";
import { EmptyState } from "@/components/ui/EmptyState";
import { GalleryView } from "@/components/GalleryView";

export default async function ProgressGalleryPage() {
  const supabase = await createClient();
  const { t } = await getServerDictionary();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: logs } = await supabase
    .from("progress_logs")
    .select("date, photo_path")
    .eq("user_id", user.id)
    .not("photo_path", "is", null)
    .order("date", { ascending: true });

  const paths = (logs ?? []).map((l) => l.photo_path!).filter(Boolean);
  const urlMap = await getSignedPhotoUrls(paths);

  const photos = (logs ?? [])
    .filter((l) => l.photo_path && urlMap.has(l.photo_path))
    .map((l) => ({ date: l.date, url: urlMap.get(l.photo_path!)! }));

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/progress"
        className="flex w-fit items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)]"
      >
        <ArrowLeft strokeWidth={1.8} className="h-4 w-4" />
        {t.progress.title}
      </Link>

      <h1 className="gradient-text-signature text-3xl font-extrabold tracking-tight">{t.progress.galleryTitle}</h1>

      {photos.length === 0 ? (
        <EmptyState icon={Images} title={t.progress.galleryTitle} description={t.progress.galleryEmpty} />
      ) : (
        <GalleryView photos={photos} />
      )}
    </div>
  );
}
