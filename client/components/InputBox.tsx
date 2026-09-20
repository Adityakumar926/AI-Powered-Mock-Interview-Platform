"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InputBoxProps {
  onSend: (message: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

export function InputBox({ onSend, onSkip, disabled }: InputBoxProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Type your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="flex-1"
        />
        {onSkip && (
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={disabled}
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            Skip ⏭️
          </Button>
        )}
        <Button onClick={handleSend} disabled={disabled || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

