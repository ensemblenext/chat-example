import { UIWidgetDefinition } from "@ensembleapp/client-sdk";
import { VendorCard, vendorCardPropsSchema, VendorCardProps } from "./VendorCard";
import { MapWidget, mapWidgetPropsSchema, MapWidgetProps } from "./MapWidget";

export const customChatWidgets: UIWidgetDefinition[] = [
  {
    widgetType: "map-widget",
    schema: mapWidgetPropsSchema,
    render: ({payload}) => <MapWidget {...payload as MapWidgetProps} />,
  },
];
