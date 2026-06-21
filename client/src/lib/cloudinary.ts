// Photos are uploaded at a fixed 800px width (server/src/modules/profile/profile.routes.ts),
// so every consumer -- including 32px nav avatars -- was downloading that same
// 800px image. This requests an appropriately-sized derivative on the fly by
// inserting a transformation segment into the Cloudinary delivery URL.
// Non-Cloudinary URLs (test fixtures, fallback strings) are returned unchanged.
export function cloudinaryThumb(url: string | undefined | null, size: number): string | undefined {
  if (!url) return undefined;
  if (!url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,g_face,q_auto,f_auto/`);
}
