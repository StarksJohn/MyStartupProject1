import type { ChatStreamEvent } from "./types";

export function encodeChatEvent(event: ChatStreamEvent) {
  return `${JSON.stringify(event)}\n`;
}

export function createChatStream({
  events,
  beforeDone,
}: {
  events: ChatStreamEvent[];
  beforeDone?: () => Promise<void>;
}) {
  const encoder = new TextEncoder();
  let beforeDoneCompleted = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (const event of events) {
          if (
            !beforeDoneCompleted &&
            (event.type === "citations" || event.type === "escalation" || event.type === "done")
          ) {
            await beforeDone?.();
            beforeDoneCompleted = true;
          }

          controller.enqueue(encoder.encode(encodeChatEvent(event)));
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeChatEvent({
              type: "error",
              message: "We could not complete this answer. Please try again.",
            })
          )
        );
        controller.close();
        console.error("Chat stream failed", { error });
      }
    },
  });
}
