import { createWidget } from "@ensembleapp/client-sdk";
import z from "zod";
import ReactDOM from 'react-dom/client';

export const vendorCardsSchema = z.object({
  fromLocation: z.string().describe('The location the user is searching for'),
  fromCoordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).describe("The location's lat/lng coordinates. This must come from the previous geocoding tool as-is - do NOT guess"),
  vendors: z.array(z.object({
    vendor_id: z.string(),
    notes: z.string().optional().describe('Why this vendor was recommended'),
    vendorCoordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).describe("The lat/lng coordinates of this vendor. This must come from the vendor's location.coordinates from the previous vendor search tool - do NOT guess"),
  })),
}).describe('displaying a list of vendor cards. Use this widget to represent data from CareNetwork vendor search tool.');

export type VendorCardsPayload = z.infer<typeof vendorCardsSchema>;

export const getCustomVendorCardsWidget = (isProd?: boolean) => {
  const vendorDetailsToolId = isProd ? '86dc78e28f933225750d9bcff7c94b18-CPgsswom7FkUYvplmy6H': 'CPgsswom7FkUYvplmy6H';
  const distanceMatrixToolId = isProd ? '82a0f402ed32bf51cfcb2c3baeb67d57-DwsbeKAxOctXSGgghvW8' : 'DwsbeKAxOctXSGgghvW8';
  return createWidget({
    widgetType: 'vendor-cards',
    reactDOM: ReactDOM,
    schema: vendorCardsSchema,
    enrich: {
      /** fetch vendor details from the list of IDs */
      vendorDetails: {
        toolId: vendorDetailsToolId,
        inputs: {
          vendorIds: "${vendors|map('vendor_id')|join(',')}",
        },
      },
      /* calculate distance from user to each vendor */
      distanceMatrix: {
        toolId: distanceMatrixToolId,
        inputs: {
          origin: "${fromCoordinates}",
          destinations: "${vendors|map('vendorCoordinates')}",
        },
      }
    },
    render: (payload, enriched) => (
      <VendorCards
        payload={payload as VendorCardsPayload}
        enriched={enriched as VendorCardsEnriched}
        onAddToList={(vendorId) => {
          window.dispatchEvent(new CustomEvent('vendor-selected', {
            detail: { vendorId }
          }));
        }}
      />
    ),
  });
};

type VendorDetail = {
  _id: string;
  created?: string;
  modified?: string;
  visibility?: string;
  added_by?: number;
  updated_by?: number;
  profile_id?: string;
  last_contacted?: string;
  region?: string;
  license_grievances?: unknown[];
  references_and_background_check?: {
    background_check_status?: string;
  };
  quality_scores?: {
    completeness_score?: number;
  };
  general_notes?: string;
  vendor_internal_notes?: string;
  has_no_internet_reviews?: boolean;
  verification?: {
    verified?: boolean;
    updated_by?: number;
    updated_by_name?: string;
    date?: string;
  };
  additional_details?: {
    next_steps?: string;
  };
  assorted_strings?: unknown[];
  booleans?: {
    free_in_home_evaluation?: boolean;
    can_request_same_caregiver?: boolean;
    is_agency_insured?: boolean;
  };
  details?: {
    services?: string[];
    specialities?: string[];
    age_groups?: string[];
  };
  description?: string;
  financials?: {
    insurances?: unknown[];
    currency?: string;
    payment_methods?: string[];
    fees?: Array<{
      fee_type?: string;
      period?: string;
      amount?: number;
      notes?: string;
    }>;
  };
  emails?: Array<{ value?: string; type?: string }>;
  gender?: string[];
  individual_or_organization?: string;
  languages?: string[];
  location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  names?: Array<{ value: string; type: string }>;
  phones?: Array<{ value: string; type?: string }>;
  scheduling?: {
    accepting_new?: string[];
    availability?: unknown[];
    hours?: string;
    min_hours_per_visit?: number;
    min_hours_per_week?: number;
    need_referral?: unknown;
    notes?: string;
  };
  subtype?: string[];
  website?: string;
  vendor_id?: string;
  created_at?: string;
  vendor_type?: string;
  review_count?: number;
  avg_rating?: number;
  address?: string;
};

type DistanceEntry = {
  destinationIndex: number;
  distanceMeters: number;
  duration: string;
};

export type VendorCardsEnriched = {
  vendorDetails?: {
    success: boolean;
    data?: Record<string, VendorDetail>;
  };
  distanceMatrix?: {
    success: boolean;
    data?: DistanceEntry[];
  };
};

interface VendorCardsProps {
  payload: VendorCardsPayload;
  enriched?: VendorCardsEnriched;
  onAddToList?: (vendorId: string) => void;
}

export function VendorCards({ payload, enriched, onAddToList }: VendorCardsProps) {
  if (!enriched || !enriched.vendorDetails || !enriched.distanceMatrix) {
    return <div>Outdated vendor-cards widget</div>;
  }

  const { vendorDetails, distanceMatrix } = enriched;
  const vendorData = (vendorDetails?.data as unknown as Record<string, VendorDetail>) ?? {};
  const distances = (distanceMatrix?.data as unknown as DistanceEntry[]) ?? [];

  // Helper to format distance in meters to miles
  const formatDistance = (meters: number): string => {
    const miles = meters / 1609.34;
    return miles < 0.1 ? '< 0.1 mi' : `${miles.toFixed(1)} mi`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {payload.vendors.map((v, index) => {
        const data = vendorData[v.vendor_id];
        const name = data?.names?.[0]?.value ?? 'Unknown';
        const address = data?.location?.address;
        const distanceEntry = distances.find(d => d.destinationIndex === index);
        const distance = distanceEntry && distanceEntry.distanceMeters ? formatDistance(distanceEntry.distanceMeters) : undefined;
        const hourlyRate = data?.financials?.fees?.find(f => f.fee_type?.includes('Hourly'))?.amount;
        const avgRating = data?.avg_rating;
        const reviewCount = data?.review_count;
        const booleans = data?.booleans;
        const verification = data?.verification;
        const cnScore = data?.quality_scores?.completeness_score;
        const subtypes = data?.subtype ?? [];
        const careLocationType = subtypes.includes('In-Home') ? 'In-Home' : subtypes.includes('In-Center') ? 'In-Center' : null;
        const backgroundCheckStatus = data?.references_and_background_check?.background_check_status?.toLowerCase();
        const hasBackgroundCheck = backgroundCheckStatus === 'clear' || backgroundCheckStatus === 'completed';

        return (
          <div
            key={v.vendor_id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
              padding: '1rem',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              fontSize: '0.875rem',
            }}
          >
            {/* Header row: Avatar, Name, Add to list */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Avatar circle with initial */}
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '9999px',
                  background: '#bfd1f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#374151',
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>
                  {name}
                </span>
              </div>
              {onAddToList && (
                <button
                  onClick={() => onAddToList(v.vendor_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Add to list
                </button>
              )}
            </div>

            {/* Rating row */}
            {(reviewCount || cnScore) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                {avgRating && (
                  <>
                    <span style={{ color: '#facc15' }}>★</span>
                    <span>{avgRating.toFixed(1)}</span>
                    {reviewCount && <span style={{ color: '#9ca3af' }}>({reviewCount} reviews)</span>}
                  </>
                )}
                {avgRating && cnScore ? <span style={{ color: '#9ca3af' }}>•</span> : null}
                {cnScore ? <span>CN Score: {cnScore}</span> : null}
              </div>
            )}

            {/* Care location type */}
            {careLocationType && (
              <div style={{ color: '#6b7280' }}>
                {careLocationType}
              </div>
            )}

            {/* Address */}
            {address && (
              <div style={{ color: '#6b7280' }}>
                {address}
              </div>
            )}

            {/* Distance */}
            {distance && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                <span>📍</span>
                <span>{distance} from {payload.fromLocation}</span>
              </div>
            )}

            {/* Rate */}
            {hourlyRate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6b7280' }}>
                <span>💰</span>
                <span>Rate: ${hourlyRate}/hr</span>
              </div>
            )}

            {/* Recommendation notes */}
            {v.notes && (
              <div style={{ color: '#374151', marginTop: '0.4rem' }}>
                <span style={{ marginRight: '0.25rem' }}>✨</span>
                <strong>Recommendation notes</strong>
                <div style={{ marginLeft: '1.25rem', marginTop: '0.25rem', color: '#6b7280' }}>
                  {v.notes}
                </div>
              </div>
            )}

            {/* Badges row */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '0.25rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid #f3f4f6',
            }}>
              {verification?.verified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>✓</span> Wellthy Verified
                </span>
              )}
              {hasBackgroundCheck && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>✓</span> Background check
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
