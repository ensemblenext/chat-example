import { createWidget, UIWidgetDefinition } from "@ensembleapp/client-sdk";
import { MapPin } from "lucide-react";
import z from "zod";

const careProviderSchema = z.object({
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
});

export const chatWidgets: UIWidgetDefinition<typeof careProviderSchema>[] = [
  createWidget({
    widgetType: "care-provider-card",
    schema: careProviderSchema,
    render: (payload) => {
      const {
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
      } = payload as z.infer<typeof careProviderSchema>;

      const mapLink = address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : null;

      const hasReviews = typeof reviewsCount === "number" || !!review;
      const hasHighlights = !!highlights?.length;

      const showTab = (tab: "reviews" | "highlights") => {
        if (typeof document === "undefined") return;
        const panels = {
          reviews: document.getElementById("cp-tab-reviews"),
          highlights: document.getElementById("cp-tab-highlights"),
        };
        const buttons = {
          reviews: document.getElementById("cp-tab-btn-reviews"),
          highlights: document.getElementById("cp-tab-btn-highlights"),
        };
        const targetPanel = panels[tab];
        const targetButton = buttons[tab];
        if (!targetPanel || !targetButton) return;

        const isOpen = !targetPanel.classList.contains("hidden");
        const nextOpen = !isOpen;

        (["reviews", "highlights"] as const).forEach((key) => {
          const panel = panels[key];
          const btn = buttons[key];
          if (!panel || !btn) return;
          const shouldOpen = nextOpen && key === tab;
          panel.classList.toggle("hidden", !shouldOpen);
          btn.classList.toggle("border-emerald-500", shouldOpen);
          btn.classList.toggle("bg-emerald-50", shouldOpen);
          btn.classList.toggle("text-emerald-700", shouldOpen);
          btn.classList.toggle("border-slate-200", !shouldOpen);
          btn.classList.toggle("bg-white", !shouldOpen);
          btn.classList.toggle("text-slate-700", !shouldOpen);
        });
      };

      return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md mt-2">
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{name}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <span className="text-amber-500">★</span>
                    <span>{typeof rating === "number" ? rating.toFixed(1) : "—"}</span>
                    {typeof reviewsCount === "number" ? (
                      <span className="text-slate-400">({reviewsCount})</span>
                    ) : null}
                  </span>
                </div>
                {description ? (
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{description}</p>
                ) : null}
                {!description && address ? (
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{address}</p>
                ) : null}
              </div>
              {mapLink ? (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-lg text-slate-600 transition hover:bg-slate-100"
                  aria-label="Open location in maps"
                >
                  <MapPin className="h-7 w-7" />
                </a>
              ) : null}
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              {email ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">✉️</span>
                  <a className="truncate text-slate-700 hover:text-slate-900" href={`mailto:${email}`}>
                    {email}
                  </a>
                </div>
              ) : null}
              {phone ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📞</span>
                  <a className="truncate text-slate-700 hover:text-slate-900" href={`tel:${phone}`}>
                    {phone}
                  </a>
                </div>
              ) : null}
              {website ? (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">🔗</span>
                  <a
                    className="truncate text-slate-700 hover:text-slate-900"
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ) : null}
            </div>

            {(hasReviews || hasHighlights) ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {hasReviews ? (
                    <button
                      id="cp-tab-btn-reviews"
                      type="button"
                      onClick={() => showTab("reviews")}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Reviews
                      {typeof reviewsCount === "number" ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {reviewsCount}
                        </span>
                      ) : null}
                    </button>
                  ) : null}
                  {hasHighlights ? (
                    <button
                      id="cp-tab-btn-highlights"
                      type="button"
                      onClick={() => showTab("highlights")}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Highlights
                      {highlights?.length ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                          {highlights.length}
                        </span>
                      ) : null}
                    </button>
                  ) : null}
                </div>

                {hasReviews ? (
                  <div
                    id="cp-tab-reviews"
                    className="hidden rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">
                      Reviews {typeof reviewsCount === "number" ? `(${reviewsCount})` : ""}
                    </p>
                    {review ? (
                      <p className="mt-2 italic text-slate-800">“{review}”</p>
                    ) : (
                      <p className="mt-2 text-slate-700">
                        {typeof reviewsCount === "number" && reviewsCount > 0
                          ? "Reviews available."
                          : "No reviews yet."}
                      </p>
                    )}
                  </div>
                ) : null}

                {hasHighlights ? (
                  <div
                    id="cp-tab-highlights"
                    className="hidden rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-900">Highlights</p>
                    <ul className="mt-2 space-y-1">
                      {highlights?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500">•</span>
                          <span>{item}</span>
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
    },
  }),
];
