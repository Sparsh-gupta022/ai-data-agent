import { ChatMessage } from "@/lib/types";

export function MessageUser({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[14.5px] leading-relaxed text-white">
        {message.content}
      </div>
    </div>
  );
}
