import { UIWidgetDefinition } from "@ensembleapp/client-sdk";
import { VendorCard, vendorCardPropsSchema, VendorCardProps } from "./VendorCard";

export const customChatWidgets: UIWidgetDefinition[] = [
  {
    widgetType: "vendor-card",
    schema: vendorCardPropsSchema,
    render: (payload) => <VendorCard {...payload as VendorCardProps} />,
  },
];
