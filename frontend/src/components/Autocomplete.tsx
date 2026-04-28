interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: any[];
  onSelect: (item: any) => void;
  placeholder: string;
  label: string;
}

export default function Autocomplete({ value, onChange, suggestions, onSelect, placeholder, label }: AutocompleteProps) {
  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none box-border"
      />
      {suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 right-0 bg-white rounded-lg z-10 shadow-lg border border-gray-200 overflow-hidden"
        >
          {suggestions.map(s => (
            <li
              key={s.id}
              role="option"
              aria-selected={false}
              onClick={() => onSelect(s)}
              className="px-4 py-3 cursor-pointer text-sm border-b border-gray-100 hover:bg-surface transition-colors"
            >
              <span className="font-semibold">{s.firstName} {s.lastName}</span>
              <span className="text-gray-400 text-xs ml-2">({s.role})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
