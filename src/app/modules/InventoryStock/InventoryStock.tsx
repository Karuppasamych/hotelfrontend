import { useState } from 'react';
import { InventoryItem } from '../../types';
import { CommonHeader } from '../../components/CommonHeader';
import { InventoryStats } from './components/InventoryStats';
import { InventoryControls } from './components/InventoryControls';
import { AgGridDataTable } from '../../components/AgGridDataTable';
import { createInventoryColumnDefs } from '../../components/InventoryColumnDefs';
import { AddItemDialog } from '../../components/AddItemDialog';
import { DeleteConfirmDialog } from '../../components/DeleteConfirmDialog';
import { useInventory } from '../utils';
import * as XLSX from 'xlsx';

export default function InventoryStock() {
  const { inventory, loading, error, addItem, updateItem, deleteItem } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockLevel, setSelectedStockLevel] = useState('All');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const categories = ['All', ...Array.from(new Set(Array.isArray(inventory) ? inventory.map((item) => item.category) : []))];

  const handleAddItem = async (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
    if (item.id) {
      const result = await updateItem(item.id, item);
      if (result.success) {
        setSuccessMessage('Item updated successfully!');
      } else {
        setSuccessMessage('Failed to update item');
      }
    } else {
      const result = await addItem(item);
      if (result.success) {
        setSuccessMessage('Item added successfully!');
      } else {
        setSuccessMessage('Failed to add item');
      }
    }
    setEditItem(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const item = Array.isArray(inventory) ? inventory.find(i => i.id === id) : null;
    if (item) {
      setItemToDelete(item);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      const result = await deleteItem(itemToDelete.id);
      if (result.success) {
        setSuccessMessage('Item deleted successfully!');
      } else {
        setSuccessMessage('Failed to delete item');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const filteredInventory = Array.isArray(inventory) ? inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStockLevel =
      selectedStockLevel === 'All' ||
      (selectedStockLevel === 'In Stock' && item.quantity_available > item.minimum_stock) ||
      (selectedStockLevel === 'Low Stock' && item.quantity_available <= item.minimum_stock && item.quantity_available > 0) ||
      (selectedStockLevel === 'Out of Stock' && item.quantity_available === 0);
    return matchesSearch && matchesCategory && matchesStockLevel;
  }) : [];

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(inventory) ? inventory : []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'inventory.xlsx');
  };

  const handleDownloadTemplate = () => {
    const templateData = [{
      product_code: 'MPH001',
      name: 'Sample Item',
      category: 'Vegetables',
      quantity_available: 0,
      unit: 'kg',
      price: 0,
      minimum_stock: 0
    }];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Template');
    XLSX.writeFile(workbook, 'inventory_template.xlsx');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const row of jsonData) {
            const item = row as any;
            if (item.product_code && item.name) {
              const existingItem = Array.isArray(inventory) ? 
                inventory.find(i => i.product_code === item.product_code) : null;
              
              const itemData = {
                product_code: item.product_code,
                name: item.name,
                category: item.category || 'Other',
                quantity_available: Number(item.quantity_available) || 0,
                unit: item.unit || 'kg',
                price: Number(item.price) || 0,
                minimum_stock: Number(item.minimum_stock) || 0
              };
              
              let result;
              if (existingItem) {
                result = await updateItem(existingItem.id, { ...itemData, id: existingItem.id });
              } else {
                result = await addItem(itemData);
              }
              
              if (result.success) {
                successCount++;
              } else {
                errorCount++;
              }
            }
          }
          
          setSuccessMessage(`Import completed: ${successCount} items processed, ${errorCount} errors`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error) {
          setSuccessMessage('Failed to import file. Please check the format.');
          setTimeout(() => setSuccessMessage(null), 3000);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset file input
    event.target.value = '';
  };

  const columnDefs = createInventoryColumnDefs(handleEdit, handleDelete);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <CommonHeader 
        successMessage={successMessage}
        showStats={true}
        statsComponent={<InventoryStats inventory={Array.isArray(inventory) ? inventory : []} />}
      />

      <div className="max-w-7xl mx-auto p-6">
        <InventoryControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedStockLevel={selectedStockLevel}
          setSelectedStockLevel={setSelectedStockLevel}
          categories={categories}
          onAddItem={() => {
            setEditItem(null);
            setIsDialogOpen(true);
          }}
          onExport={handleExport}
          onImport={handleImport}
          onDownloadTemplate={handleDownloadTemplate}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
          <AgGridDataTable
            data={filteredInventory}
            columnDefs={columnDefs}
            emptyMessage="No items in inventory. Add your first item to get started."
            emptyIcon="📦"
            height="350px"
            paginationPageSize={5}
          />
        </div>

        <AddItemDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditItem(null);
          }}
          onSave={handleAddItem}
          editItem={editItem}
        />
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          itemName={itemToDelete?.name || ''}
        />
      </div>
    </div>
  );
}