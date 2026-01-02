import { MapPin } from "lucide-react";
import z from "zod";

export const vendorCardPropsSchema = z.object({
  id: z.string().describe('Unique _id for this vendor'),
  name: z.string().describe('Vendor name (vendorDetails.names[0])'),
  description: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),

  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  review: z.string().optional().describe('A highlighted review from this vendor'),
  hours: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  darkMode: z.boolean().optional().describe('Use a dark theme for the card'),
}).describe('Card showing information about a business, vendor, or service provider');
export type VendorCardProps = z.infer<typeof vendorCardPropsSchema>;

export const VendorCard = ({
  id,
  name,
  address,
  description,
  rating,
  reviewsCount,
  highlights,
  phone,
  email,
  website,
  review,
  darkMode,
}: VendorCardProps) => {
  const baseId = `vendor-card-${id}`;
  const reviewsPanelId = `${baseId}-reviews`;
  const highlightsPanelId = `${baseId}-highlights`;
  const reviewsButtonId = `${baseId}-btn-reviews`;
  const highlightsButtonId = `${baseId}-btn-highlights`;

  const isDark = !!darkMode;

  const mapLink = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  const hasReviews = typeof reviewsCount === "number" || !!review;
  const hasHighlights = !!highlights?.length;

  const toggleTab = (tab: "reviews" | "highlights") => {
    if (typeof document === "undefined") return;

    const panels = {
      reviews: document.getElementById(reviewsPanelId),
      highlights: document.getElementById(highlightsPanelId),
    };
    const buttons = {
      reviews: document.getElementById(reviewsButtonId),
      highlights: document.getElementById(highlightsButtonId),
    };
    const targetPanel = panels[tab];
    const targetButton = buttons[tab];
    if (!targetPanel || !targetButton) return;

    const isOpen = !targetPanel.classList.contains("hidden");
    const nextOpen = !isOpen;

    const activeClasses = isDark
      ? ["border-emerald-500", "bg-emerald-900", "text-emerald-50"]
      : ["border-emerald-500", "bg-emerald-50", "text-emerald-700"];
    const inactiveClasses = isDark
      ? ["border-slate-700", "bg-slate-800", "text-slate-100"]
      : ["border-slate-200", "bg-white", "text-slate-700"];

    (["reviews", "highlights"] as const).forEach((key) => {
      const panel = panels[key];
      const btn = buttons[key];
      if (!panel || !btn) return;
      const shouldOpen = nextOpen && key === tab;
      panel.classList.toggle("hidden", !shouldOpen);
      activeClasses.forEach((cls) => btn.classList.toggle(cls, shouldOpen));
      inactiveClasses.forEach((cls) => btn.classList.toggle(cls, !shouldOpen));
    });
  };

  const tabBaseClasses =
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition";

  const panelBaseClasses =
    isDark
      ? "rounded-lg border border-slate-800 bg-slate-800/60 p-3 text-sm text-slate-100"
      : "rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700";

  return (
    <div
      className={`group relative mt-2 overflow-hidden rounded-2xl border shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
        isDark
          ? "border-slate-800 bg-slate-900 ring-slate-800/60"
          : "border-slate-100 bg-white ring-slate-200/60"
      }`}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <h3 className={`text-base font-semibold ${isDark ? "text-slate-50" : "text-slate-900"}`}>
                {name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isDark ? "bg-slate-800 text-slate-100" : "bg-slate-50 text-slate-700"
                }`}
              >
                <span className="text-amber-500">★</span>
                <span>{typeof rating === "number" ? rating.toFixed(1) : "—"}</span>
                {typeof reviewsCount === "number" ? (
                  <span className={isDark ? "text-slate-400" : "text-slate-400"}>({reviewsCount})</span>
                ) : null}
              </span>
            </div>
            {description ? (
              <p className={`mt-1 line-clamp-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {description}
              </p>
            ) : null}
            {!description && address ? (
              <p className={`mt-1 line-clamp-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {address}
              </p>
            ) : null}
          </div>
          {mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                isDark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              aria-label="Open location in maps"
            >
              <MapPin className="h-7 w-7" />
            </a>
          ) : null}
        </div>

        <div className={`grid gap-3 text-sm sm:grid-cols-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
          {email ? (
            <div className="flex items-center gap-2">
              <span className={isDark ? "text-slate-400" : "text-slate-400"}>✉️</span>
              <a
                className={`truncate ${isDark ? "text-slate-100 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                href={`mailto:${email}`}
              >
                {email}
              </a>
            </div>
          ) : null}
          {phone ? (
            <div className="flex items-center gap-2">
              <span className={isDark ? "text-slate-400" : "text-slate-400"}>📞</span>
              <a
                className={`truncate ${isDark ? "text-slate-100 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                href={`tel:${phone}`}
              >
                {phone}
              </a>
            </div>
          ) : null}
          {website ? (
            <div className="flex items-center gap-2">
              <span className={isDark ? "text-slate-400" : "text-slate-400"}>🔗</span>
              <a
                className={`truncate ${isDark ? "text-slate-100 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}
                href={website}
                target="_blank"
                rel="noreferrer"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ) : null}
        </div>

        {hasReviews || hasHighlights ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {hasReviews ? (
                <button
                  id={reviewsButtonId}
                  type="button"
                  onClick={() => toggleTab("reviews")}
                  className={`${tabBaseClasses} ${
                    isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Reviews
                  {typeof reviewsCount === "number" ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isDark ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {reviewsCount}
                    </span>
                  ) : null}
                </button>
              ) : null}
              {hasHighlights ? (
                <button
                  id={highlightsButtonId}
                  type="button"
                  onClick={() => toggleTab("highlights")}
                  className={`${tabBaseClasses} ${
                    isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Highlights
                  {highlights?.length ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isDark ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {highlights.length}
                    </span>
                  ) : null}
                </button>
              ) : null}
            </div>

            {hasReviews ? (
              <div
                id={reviewsPanelId}
                className={`${panelBaseClasses} hidden`}
              >
                <p className={`font-semibold ${isDark ? "text-slate-50" : "text-slate-900"}`}>
                  Reviews {typeof reviewsCount === "number" ? `(${reviewsCount})` : ""}
                </p>
                {review ? (
                  <p className={`mt-2 italic ${isDark ? "text-slate-100" : "text-slate-800"}`}>“{review}”</p>
                ) : (
                  <p className={`mt-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                    {typeof reviewsCount === "number" && reviewsCount > 0
                      ? "Reviews available."
                      : "No reviews yet."}
                  </p>
                )}
              </div>
            ) : null}

            {hasHighlights ? (
              <div
                id={highlightsPanelId}
                className={`${panelBaseClasses} hidden`}
              >
                <p className={`font-semibold ${isDark ? "text-slate-50" : "text-slate-900"}`}>Highlights</p>
                <ul className="mt-2 space-y-1">
                  {highlights?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      <span className={isDark ? "text-slate-100" : "text-slate-800"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
