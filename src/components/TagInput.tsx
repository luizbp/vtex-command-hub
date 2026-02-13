import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  suggestions?: string[];
  fillOnSelect?: boolean;
  suffixWhenFilling?: string;
}

export function TagInput({
  values,
  onChange,
  placeholder,
  label,
  suggestions = [],
  fillOnSelect = false,
  suffixWhenFilling = "",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addTag = (tag?: string) => {
    const trimmed = (tag ?? input).trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const fillInput = (tag?: string) => {
    setInput((tag ?? input) + suffixWhenFilling);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && showSuggestions) {
        addTag(filteredSuggestions[0]);
      } else {
        addTag();
      }
    }
    if (e.key === "Backspace" && !input && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleOnBlur = () => {
    if (fillOnSelect) {
      setTimeout(() => setShowSuggestions(false), 100);
      return;
    }

    setTimeout(() => addTag(), 100);
  };

  const filteredSuggestions = suggestions
    .filter(
      (s) =>
        s.toLowerCase().includes(input.toLowerCase()) && !values.includes(s),
    )
    .slice(0, 5);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background relative">
        {values.map((tag, i) => (
          <Badge key={i} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <div className="relative flex-1 min-w-[120px]">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleOnBlur}
            placeholder={values.length === 0 ? placeholder : ""}
            className="h-7 flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-auto text-sm">
              {filteredSuggestions.map((s, idx) => (
                <li
                  key={s}
                  className="px-2 py-1 cursor-pointer hover:bg-muted"
                  onMouseDown={() => (fillOnSelect ? fillInput(s) : addTag(s))}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
