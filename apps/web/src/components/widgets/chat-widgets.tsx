import type { UIWidgetDefinition,  } from "@ensembleapp/client-sdk";
import { createWidget } from "@ensembleapp/client-sdk";
import { MapWidget, mapWidgetPropsSchema, MapWidgetProps } from "./MapWidget";
import { VendorCards, VendorCardsEnriched, VendorCardsPayload, vendorCardsSchema } from "./VendorCards";

export const customChatWidgets: UIWidgetDefinition[] = [
  {
    widgetType: "map-widget",
    schema: mapWidgetPropsSchema,
    render: (payload) => <MapWidget {...payload as MapWidgetProps} />,
  },
  createWidget({
    widgetType: 'vendor-cards',
    schema: vendorCardsSchema,
    enrich: {
      /** fetch vendor details from the list of IDs */
      vendorDetails: {
        // Sandbox: CPgsswom7FkUYvplmy6H, Prod: 86dc78e28f933225750d9bcff7c94b18-CPgsswom7FkUYvplmy6H
        // TODO: use environment variable
        toolId: 'CPgsswom7FkUYvplmy6H',
        inputs: {
          vendorIds: "${vendors|map('vendor_id')|join(',')}",
        },
      },
      /* calculate distance from user to each vendor */
      distanceMatrix: {
        // Sandbox: DwsbeKAxOctXSGgghvW8, Prod: 86dc78e28f933225750d9bcff7c94b18-DwsbeKAxOctXSGgghvW8
        // TODO: use environment variable
        toolId: 'DwsbeKAxOctXSGgghvW8',
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
  }),
];
