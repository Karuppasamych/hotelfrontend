import { Plus, Download, Upload, FileText } from 'lucide-react';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/button';
import { FileInput } from '../../../components/ui/FileInput';

interface InventoryControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedStockLevel: string;
  setSelectedStockLevel: (level: string) => void;
  categories: string[];
  onAddItem: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

export function InventoryControls({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedStockLevel,
  setSelectedStockLevel,
  categories,
  onAddItem,
  onExport,
  onImport,
  onDownloadTemplate
}: InventoryControlsProps) {
  const stockLevelOptions = [
    'All Stock Levels',
    'In Stock', 
    'Low Stock',
    'Out of Stock'
  ];

  return (
    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-md mb-6 p-4 border border-gray-300">
      <div className="flex flex-col md:flex-row gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search items..."
        />
        
        <Select
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories}
        />
        
        <Select
          value={selectedStockLevel}
          onChange={setSelectedStockLevel}
          options={stockLevelOptions.map(level => ({
            value: level === 'All Stock Levels' ? 'All' : level,
            label: level
          }))}
        />
        
        <Button onClick={onAddItem} variant="primary">
          <Plus className="size-4" />
          Add
        </Button>
        
        <Button onClick={onDownloadTemplate} variant="secondary">
          <FileText className="size-4" />
          Get Template
        </Button>
        
        <FileInput
          onChange={onImport}
          accept=".xlsx, .xls"
          id="import-file"
        >
          <Upload className="size-4" />
          Import
        </FileInput>

        <Button onClick={onExport} variant="success">
          <Download className="size-4" />
          Export
        </Button>
        
      </div>
    </div>
  );
}