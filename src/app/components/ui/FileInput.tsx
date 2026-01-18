import { ReactNode } from 'react';

interface FileInputProps {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function FileInput({ 
  onChange, 
  accept, 
  children, 
  className = "",
  id = "file-input"
}: FileInputProps) {
  return (
    <>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        id={id}
      />
      <label
        htmlFor={id}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 shadow-md hover:shadow-indigo-600/30 text-sm font-medium cursor-pointer ${className}`}
      >
        {children}
      </label>
    </>
  );
}