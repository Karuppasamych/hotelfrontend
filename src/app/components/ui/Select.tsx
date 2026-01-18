interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | string[];
  className?: string;
}

export function Select({ value, onChange, options, className = "" }: SelectProps) {
  const normalizedOptions = options.map(option => 
    typeof option === 'string' 
      ? { value: option, label: option }
      : option
  );

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 ${className}`}
    >
      {normalizedOptions.map((option) => (
        <option key={option.value} value={option.value} className="bg-white text-gray-900">
          {option.label}
        </option>
      ))}
    </select>
  );
}