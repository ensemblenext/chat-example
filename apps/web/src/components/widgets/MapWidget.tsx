import React from "react";
import z from "zod";
import { vendorCardPropsSchema, VendorCardProps, VendorCard } from "./VendorCard";

type GoogleMapsRef = typeof google | undefined;
type VendorLocation = VendorCardProps & { lat: number; lng: number };

const vendorLocationSchema = vendorCardPropsSchema
  .extend({
    lat: z.number().describe("Latitude"),
    lng: z.number().describe("Longitude"),
  })
  .describe("Vendor/location with coordinates");

export const mapWidgetPropsSchema = z
  .object({
    mapApiKey: z.string().optional().describe("Google Maps API key; defaults to env"),
    locations: z.array(vendorLocationSchema).nonempty("At least one location"),
  })
  .describe(
    "Display a map with vendor locations and details. Use this when searching for businesses or services in a specific area.",
  );

export type MapWidgetProps = z.infer<typeof mapWidgetPropsSchema>;

const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#4b5563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#374151" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1f2937" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#4b5563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
];

let googlePromise: Promise<GoogleMapsRef> | null = null;

const loadGoogleMaps = (apiKey: string): Promise<GoogleMapsRef> => {
  if (typeof window === "undefined") return Promise.resolve(undefined);
  if (window.google?.maps) return Promise.resolve(window.google);
  if (googlePromise) return googlePromise;

  const existingScript = document.getElementById("google-maps-sdk");
  if (existingScript) {
    googlePromise = new Promise((resolve) => {
      existingScript.addEventListener("load", () => resolve(window.google));
    });
    return googlePromise;
  }

  googlePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-maps-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });

  return googlePromise;
};

type MapWidgetState = {
  selectedId: string;
};

export class MapWidget extends React.Component<MapWidgetProps, MapWidgetState> {
  private containerRef = React.createRef<HTMLDivElement>();
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];

  state: MapWidgetState = {
    selectedId: this.props.locations[0]?.id ?? "",
  };

  componentDidMount() {
    this.ensureMap();
  }

  componentDidUpdate(prevProps: MapWidgetProps) {
    const locationsChanged =
      prevProps.locations.length !== this.props.locations.length ||
      prevProps.locations.some((prev, idx) => prev.id !== this.props.locations[idx]?.id);

    if (locationsChanged) {
      const firstId = this.props.locations[0]?.id ?? "";
      const stillExists = this.props.locations.some((l) => l.id === this.state.selectedId);
      this.setState({ selectedId: stillExists ? this.state.selectedId : firstId });
    }

    if (locationsChanged || prevProps.mapApiKey !== this.props.mapApiKey) {
      this.ensureMap();
    }
  }

  componentWillUnmount() {
    this.clearMarkers();
    this.map = null;
  }

  private get apiKey(): string | undefined {
    return this.props.mapApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  private async ensureMap() {
    const key = this.apiKey;
    if (!key) {
      console.warn("Google Maps API key missing");
      return;
    }

    const googleRef = await loadGoogleMaps(key);
    if (!googleRef || !this.containerRef.current || !this.props.locations.length) return;

    const first = this.props.locations[0];
    const center = new googleRef.maps.LatLng(first.lat, first.lng);

    if (!this.map) {
      this.map = new googleRef.maps.Map(this.containerRef.current, {
        center,
        zoom: 12,
        styles: darkMapStyle,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
        keyboardShortcuts: false,
        clickableIcons: false,
        gestureHandling: "greedy",
      });
    }

    this.refreshMarkers(googleRef);
  }

  private clearMarkers() {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
  }

  private getOverlayWidth(): number {
    const containerWidth = this.containerRef.current?.clientWidth ?? 1080;
    // Target ~1/3 of the map, with sensible min/max.
    return Math.max(320, Math.min(containerWidth * 0.33, 440));
  }

  private getOverlayPadding(): google.maps.Padding {
    const overlayWidth = this.getOverlayWidth();
    return { left: 24, right: overlayWidth + 24, top: 24, bottom: 24 };
  }

  private refreshMarkers(googleRef: typeof google) {
    if (!this.map) return;

    this.clearMarkers();

    this.markers = this.props.locations.map((loc) => {
      const marker = new googleRef.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: this.map!,
        title: loc.name,
      });

      marker.addListener("click", () => {
        this.setState({ selectedId: loc.id });
      });

      return marker;
    });

    if (this.props.locations.length === 1) {
      this.map.setCenter({ lat: this.props.locations[0].lat, lng: this.props.locations[0].lng });
      this.map.setZoom(12);
      // Nudge view so the marker sits in the visible area beside the overlay (overlay on the right).
      const halfOverlay = this.getOverlayWidth() / 2;
      this.map.panBy(-halfOverlay, 0);
    } else {
      const bounds = new googleRef.maps.LatLngBounds();
      this.props.locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      this.map.fitBounds(bounds, this.getOverlayPadding());
    }
  }

  private getSelectedLocation(): VendorLocation | undefined {
    return this.props.locations.find((l) => l.id === this.state.selectedId) || this.props.locations[0];
  }

  private toVendorProps(loc?: VendorLocation): VendorCardProps | undefined {
    if (!loc) return undefined;
    const { lat, lng, ...vendorProps } = loc;
    return { ...vendorProps, darkMode: true };
  }

  render() {
    const selectedLocation = this.getSelectedLocation();
    const missingKey = !this.apiKey;

    return (
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm md:h-96">
        <div ref={this.containerRef} className="h-72 w-full md:h-full">
          {missingKey ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
              Google Maps API key missing
            </div>
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 md:inset-y-6 md:right-6 md:left-auto md:w-1/3 md:min-w-[320px] md:max-w-[440px]">
          {selectedLocation ? (
            <div className="pointer-events-auto">
              <VendorCard {...this.toVendorProps(selectedLocation)!} />
            </div>
          ) : (
            <div className="pointer-events-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-300 backdrop-blur">
              Select a pin to view details.
            </div>
          )}
        </div>
      </div>
    );
  }
}
