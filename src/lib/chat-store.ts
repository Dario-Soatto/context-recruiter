import { Chat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";

const chatInstances = new Map<string, Chat<UIMessage>>();

const transport = new DefaultChatTransport({ api: "/api/agent" });

export function getChatInstance(
  chatId: string,
  initialMessages?: UIMessage[]
): Chat<UIMessage> {
  let instance = chatInstances.get(chatId);
  if (!instance) {
    instance = new Chat({
      id: chatId,
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      messages: initialMessages,
    });
    chatInstances.set(chatId, instance);
  }
  return instance;
}

export function deleteChatInstance(chatId: string) {
  const instance = chatInstances.get(chatId);
  if (instance) {
    instance.stop();
    chatInstances.delete(chatId);
  }
}
