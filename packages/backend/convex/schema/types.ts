/**
 * TypeScript type for HTTPAIMessage
 * Corresponds to the Convex validator in schema/message.ts
 */

export interface HTTPAIMessage {
   messageId?: string;
   role: "user" | "assistant" | "system";
   content?: string;
   parts: MessagePart[];
}

export interface TextPart {
   type: "text";
   text: string;
}

export interface ImagePart {
   type: "image";
   image: string;
   mimeType: string;
}

export interface ReasoningPart {
   type: "reasoning";
   reasoning: string;
   signature?: string;
   duration?: number;
   details?: Array<{
      type: "text" | "redacted";
      text?: string;
      data?: string;
      signature?: string;
   }>;
}

export interface FilePart {
   type: "file";
   data: string;
   filename?: string;
   mimeType?: string;
}

export interface ErrorUIPart {
   type: "error";
   error: {
      code: string;
      message: string;
   };
}

export interface ToolInvocationUIPart {
   type: "tool-invocation";
   toolInvocation: {
      state: "call" | "result" | "partial-call";
      args?: any;
      result?: any;
      toolCallId: string;
      toolName: string;
      step?: number;
   };
}

export type MessagePart = TextPart | ImagePart | ReasoningPart | FilePart | ErrorUIPart | ToolInvocationUIPart;
