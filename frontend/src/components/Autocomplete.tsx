import { useState, useEffect, useRef } from "react";
import type { UserSearchResult } from "../types";

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: UserSearchResult[];
  onSelect: (item: UserSearchResult) => void;
  placeholder: string;
  label: string;
}

export default function Autocomplete({
  value,
  onChange,
  suggestions,
  onSelect,
  placeholder,
  label
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = "autocomplete-listbox";
  const inputRef = useRef<HTMLInputElement>(null);

  // Ouvrir la liste quand il y a des suggestions
  useEffect(() => {
    setIsOpen(suggestions.length > 0);
    setActiveIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case "Enter":
        if (activeIndex >= 0) {
          e.preventDefault();
          onSelect(suggestions[activeIndex]);
          setIsOpen(false);
        }
        break;

      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={label}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
        }
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary box-border"
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 right-0 bg-white rounded-lg z-10 shadow-lg border border-gray-200 overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listboxId}-item-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => onSelect(s)} // important : mousedown pour éviter blur
              className={`px-4 py-3 cursor-pointer text-sm border-b border-gray-100 transition-colors
                ${i === activeIndex ? "bg-primary/10" : "hover:bg-surface"}
              `}
            >
              <span className="font-semibold">
                {s.firstName} {s.lastName}
              </span>
              <span className="text-gray-400 text-xs ml-2">({s.role})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
