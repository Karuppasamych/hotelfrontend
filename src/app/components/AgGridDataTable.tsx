import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface AgGridDataTableProps<T = any> {
  data: T[];
  columnDefs: ColDef[];
  height?: string | number;
  pagination?: boolean;
  paginationPageSize?: number;
  rowSelection?: 'single' | 'multiple';
  onGridReady?: (params: { api: GridApi }) => void;
  onRowClicked?: (event: any) => void;
  onSelectionChanged?: (event: any) => void;
  emptyMessage?: string;
  emptyIcon?: string;
  className?: string;
  suppressRowClickSelection?: boolean;
  animateRows?: boolean;
  rowHeight?: number;
  headerHeight?: number;
  enableRangeSelection?: boolean;
  enableCharts?: boolean;
  sideBar?: boolean | any;
  getRowStyle?: (params: any) => any;
}

export function AgGridDataTable<T = any>({
  data,
  columnDefs,
  height = '600px',
  pagination = true,
  paginationPageSize = 5,
  rowSelection = 'multiple',
  onGridReady,
  onRowClicked,
  onSelectionChanged,
  emptyMessage = 'No data available',
  emptyIcon = '📊',
  className = '',
  suppressRowClickSelection = true,
  animateRows = true,
  rowHeight = 50,
  headerHeight = 45,
  enableRangeSelection = false,
  enableCharts = false,
  sideBar = false,
  getRowStyle
}: AgGridDataTableProps<T>) {
  
  const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    minWidth: 100
  };

  const handleGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
    if (onGridReady) {
      onGridReady({ api: params.api });
    }
  };

  const defaultGetRowStyle = (params: any) => {
    if (params?.node?.rowIndex != null && params.node.rowIndex % 2 === 0) {
      return { backgroundColor: '#ffffff' };
    } else {
      return { backgroundColor: '#f9fafb' };
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="mx-auto mb-4 w-12 h-12 text-gray-400 text-4xl">{emptyIcon}</div>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div 
      className={`ag-theme-alpine ${className}`} 
      style={{ height, width: '100%' }}
    >
      <AgGridReact
        theme="legacy"
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
        onRowClicked={onRowClicked}
        onSelectionChanged={onSelectionChanged}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        rowSelection={rowSelection}
        suppressRowClickSelection={suppressRowClickSelection}
        animateRows={animateRows}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        enableRangeSelection={enableRangeSelection}
        enableCharts={enableCharts}
        sideBar={sideBar}
        getRowStyle={getRowStyle || defaultGetRowStyle}
        suppressMenuHide={true}
        suppressMovableColumns={false}
        enableCellTextSelection={true}
        ensureDomOrder={true}
        maintainColumnOrder={true}
      />
    </div>
  );
}