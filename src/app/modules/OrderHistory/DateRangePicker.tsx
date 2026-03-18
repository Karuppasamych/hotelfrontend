import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClear = () => {
    onStartDateChange(null);
    onEndDateChange(null);
    setSelectingStart(true);
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      onStartDateChange(date);
      onEndDateChange(null);
      setSelectingStart(false);
    } else {
      if (startDate && date < startDate) {
        onEndDateChange(startDate);
        onStartDateChange(date);
      } else {
        onEndDateChange(date);
      }
      setSelectingStart(true);
    }
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return 'Select Date Range';
    if (startDate && !endDate) return `From ${format(startDate, 'dd MMM yyyy')}`;
    if (!startDate && endDate) return `To ${format(endDate, 'dd MMM yyyy')}`;
    return `${format(startDate!, 'dd MMM')} - ${format(endDate!, 'dd MMM yyyy')}`;
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isRangeStart = (date: Date) => {
    return startDate && isSameDay(date, startDate);
  };

  const isRangeEnd = (date: Date) => {
    return endDate && isSameDay(date, endDate);
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2 min-w-[240px] text-sm font-medium text-gray-700"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm">{formatDateRange()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 min-w-[340px]">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 hover:scale-110 active:scale-90 rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <h3 className="text-base font-semibold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 hover:scale-110 active:scale-90 rounded-lg transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Selection Mode Indicator */}
          <div className="mb-3 text-xs text-gray-600 text-center bg-blue-50 py-2 rounded-lg border border-blue-100">
            {selectingStart ? 'Select start date' : 'Select end date'}
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isInDateRange = isInRange(day);
              const isStart = isRangeStart(day);
              const isEnd = isRangeEnd(day);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={index}
                  onClick={() => isCurrentMonth && handleDateClick(day)}
                  disabled={!isCurrentMonth}
                  className={`
                    relative aspect-square p-2 text-sm rounded-lg transition-all
                    ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 cursor-pointer hover:scale-110 active:scale-90'}
                    ${isTodayDate && !isStart && !isEnd ? 'border-2 border-blue-400' : ''}
                    ${isStart || isEnd ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
                    ${isInDateRange && !isStart && !isEnd ? 'bg-blue-100 text-blue-700' : ''}
                    ${!isStart && !isEnd && !isInDateRange && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                onStartDateChange(weekAgo);
                onEndDateChange(today);
                setSelectingStart(true);
              }}
              className="px-2 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 active:scale-95 transition-all text-xs font-medium border border-slate-200"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                onStartDateChange(monthAgo);
                onEndDateChange(today);
                setSelectingStart(true);
              }}
              className="px-2 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 active:scale-95 transition-all text-xs font-medium border border-slate-200"
            >
              Last 30 days
            </button>
            <button
              onClick={() => {
                const today = new Date();
                onStartDateChange(startOfMonth(today));
                onEndDateChange(endOfMonth(today));
                setSelectingStart(true);
              }}
              className="px-2 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 active:scale-95 transition-all text-xs font-medium border border-slate-200"
            >
              This month
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all font-medium text-sm inline-flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all font-medium text-sm shadow-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
