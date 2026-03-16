import type { UIWidgetDefinition } from "@ensembleapp/client-sdk";
import ReactDOM from 'react-dom/client';
import { MapWidget, mapWidgetPropsSchema, MapWidgetProps } from "./MapWidget";

export const customChatWidgets: UIWidgetDefinition[] = [
  {
    widgetType: "map-widget",
    schema: mapWidgetPropsSchema,
    reactDOM: ReactDOM,
    render: (payload) => <MapWidget {...payload as MapWidgetProps} />,
  },
];
