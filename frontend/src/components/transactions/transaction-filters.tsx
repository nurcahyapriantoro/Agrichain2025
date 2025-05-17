'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AdjustmentsHorizontalIcon, XMarkIcon, CalendarIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { format } from 'date-fns';

export interface TransactionFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  productId?: string;
  userId?: string;
  publicKey?: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  onReset: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFilterChange,
  onReset
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search });
  };

  const handleDateSelect = (date: Date | undefined, field: 'startDate' | 'endDate') => {
    if (date) {
      onFilterChange({
        ...filters,
        [field]: date.toISOString().split('T')[0]
      });
    }
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value
    });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      type: value
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(val => val !== undefined);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onReset}
          className="text-gray-400 hover:text-white"
        >
          Reset all
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Transaction Status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <Select
            value={filters.status || ''}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Status</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="TRANSFERRED">Transferred</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
          <Select
            value={filters.type || ''}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Any Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Type</SelectItem>
              <SelectItem value="CREATE">Creation</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
              <SelectItem value="VERIFY">Verification</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="RECALL">Recall</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Date Range</label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate ? new Date(filters.startDate) : undefined}
                  onSelect={(date) => handleDateSelect(date, 'startDate')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate ? new Date(filters.endDate) : undefined}
                  onSelect={(date) => handleDateSelect(date, 'endDate')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}; 