import { createWidget, type UIWidgetDefinition } from "@ensembleapp/client-sdk";
import ReactDOM from 'react-dom/client';
import { MapWidget, mapWidgetPropsSchema, MapWidgetProps } from "./MapWidget";
import {
  HybridVendorCards,
  vendorCardsSchema,
  type VendorCardsPayload,
  type VendorCardsEnriched,
} from "./VendorCards";

// Tool IDs for enrichment
const VENDOR_DETAILS_TOOL_ID = 'CPgsswom7FkUYvplmy6H';
const DISTANCE_MATRIX_TOOL_ID = 'DwsbeKAxOctXSGgghvW8';

/**
 * Custom chat widgets with hybrid enrichment:
 * - Server enriches vendor details (parallel to LLM, immediate render)
 * - Client fetches distance matrix (progressive, fills in after render)
 */
export const customChatWidgets: UIWidgetDefinition[] = [
  {
    widgetType: "map-widget",
    schema: mapWidgetPropsSchema,
    reactDOM: ReactDOM,
    render: (payload) => <MapWidget {...payload as MapWidgetProps} />,
  },
  createWidget({
    widgetType: 'vendor-cards',
    reactDOM: ReactDOM,
    schema: vendorCardsSchema,
    // server enrichment
    enrich: {
      vendorDetails: {
        toolId: VENDOR_DETAILS_TOOL_ID,
        inputs: {
          vendorIds: "${vendors|map('vendor_id')|join(',')}",
        },
      },
    },
    render: (payload, { vendorDetails }, { messageContext, invokeTool }) => (
      <HybridVendorCards
        payload={payload as VendorCardsPayload}
        vendorDetails={vendorDetails as VendorCardsEnriched['vendorDetails']}
        distanceMatrixToolId={DISTANCE_MATRIX_TOOL_ID}
        invokeTool={invokeTool}
        messageContext={messageContext}
        onAddToList={(vendorId) => {
          window.dispatchEvent(new CustomEvent('vendor-selected', {
            detail: { vendorId }
          }));
        }}
      />
    ),
  }),
];
