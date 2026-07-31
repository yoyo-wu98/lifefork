import { isRecord, stringValue, type Schema } from "./common";

export interface ChatLLMResponse {
  reply: string;
}

export const chatResponseSchema: Schema<ChatLLMResponse> = {
  name: "chatResponse",
  parse(value) {
    if (!isRecord(value)) return { success: false, error: "response must be an object" };
    const reply = stringValue(value.reply).trim();
    if (!reply) return { success: false, error: "reply is required" };
    return { success: true, data: { reply: reply.slice(0, 500) } };
  },
};
