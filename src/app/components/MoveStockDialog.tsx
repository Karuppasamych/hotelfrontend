import { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';

interface MoveStockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (toAvailable: number, toPrepared: number) => void;
  itemName: string;
  remainingQuantity: number;
  unit: string;
}

export function MoveStockDialog({ isOpen, onClose, onConfirm, itemName, remainingQuantity, unit }: MoveStockDialogProps) {
  const [toAvailable, setToAvailable] = useState('');
  const [toPrepared, setToPrepared] = useState('');

  if (!isOpen) return null;

  const handleAvailableChange = (val: string) => {
    setToAvailable(val);
    const num = parseFloat(val) || 0;
    setToPrepared(Math.max(0, remainingQuantity - num).toString());
  };

  const handlePreparedChange = (val: string) => {
    setToPrepared(val);
    const num = parseFloat(val) || 0;
    setToAvailable(Math.max(0, remainingQuantity - num).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const availableQty = parseFloat(toAvailable) || 0;
    const preparedQty = parseFloat(toPrepared) || 0;
    if (availableQty + preparedQty > remainingQuantity + 0.01) return;
    if (availableQty + preparedQty <= 0) return;
    onConfirm(availableQty, preparedQty);
    setToAvailable('');
    setToPrepared('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="size-5 text-teal-600" />
            <h2 className="text-lg font-semibold">Move to Inventory</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">{itemName}</p>
            <p className="text-xs text-gray-500 mt-1">
              Quantity to move: <span className="font-semibold">{remainingQuantity} {unit}</span>
            </p>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            How much should go to each stock type in inventory?
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Available Stock ({unit})
              </label>
              <input
                type="number"
                min="0"
                max={remainingQuantity}
                step="0.1"
                value={toAvailable}
                onChange={(e) => handleAvailableChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Prepared Stock ({unit})
              </label>
              <input
                type="number"
                min="0"
                max={remainingQuantity}
                step="0.1"
                value={toPrepared}
                onChange={(e) => handlePreparedChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 shadow-lg font-medium"
            >
              Move
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
