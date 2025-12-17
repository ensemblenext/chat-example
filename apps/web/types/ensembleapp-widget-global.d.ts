import '@ensembleapp/client-sdk/dist/widget/widget.global';
import type { EmbeddableChatWidgetConfig } from '@ensembleapp/client-sdk';

declare global {
  interface Window {
    /**
     * Mutable config the widget reads from; set when initializing the chat widget.
     */
    chatWidgetConfig?: EmbeddableChatWidgetConfig;
  }
}
