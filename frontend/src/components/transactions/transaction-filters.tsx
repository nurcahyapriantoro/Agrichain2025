'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AdjustmentsHorizontalIcon, XMarkIcon, CalendarIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { format } from 'date-fns';

export interface TransactionFilters {
  productId?: string;
  type?: string;
  status?: string;
  fromUser?: string;
  toUser?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
  onReset: () => void;
}

export default function TransactionFilters({ 
  filters, 
  onFilterChange, 
  onReset 
}: TransactionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search });
  };

  const handleSelectChange = (field: keyof TransactionFilters, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value === 'all' ? undefined : value
    });
  };

  const handleDateChange = (field: 'fromDate' | 'toDate', date: Date | undefined) => {
    onFilterChange({
      ...filters,
      [field]: date
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(val => val !== undefined);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-6">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search transactions by product name, users, or ID..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button 
            type="button" 
            variant={isOpen ? "primary" : "outline"} 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Filters {hasActiveFilters() && <span className="inline-flex items-center justify-center w-4 h-4 ml-1 text-xs font-semibold text-white bg-green-500 rounded-full">+</span>}
          </Button>
          {hasActiveFilters() && (
            <Button type="button" variant="outline" onClick={onReset} className="flex items-center gap-1">
              <XMarkIcon className="h-5 w-5" />
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Expanded Filters */}
      {isOpen && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800">
          {/* Transaction Type Filter */}
          <div>
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              id="type"
              value={filters.type || 'all'}
              onValueChange={(value) => handleSelectChange('type', value)}
              className="w-full mt-1"
            >
              <option value="all">All Types</option>
              <option value="transfer">Transfer</option>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
              <option value="verification">Verification</option>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={filters.status || 'all'}
              onValueChange={(value) => handleSelectChange('status', value)}
              className="w-full mt-1"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="transferred">Transferred</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </Select>
          </div>

          {/* From Date Picker */}
          <div>
            <Label htmlFor="fromDate">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="fromDate"
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.fromDate ? format(filters.fromDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.fromDate}
                  onSelect={(date) => handleDateChange('fromDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date Picker */}
          <div>
            <Label htmlFor="toDate">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="toDate"
                  variant="outline"
                  className="w-full mt-1 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.toDate ? format(filters.toDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.toDate}
                  onSelect={(date) => handleDateChange('toDate', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Product ID Filter */}
          <div>
            <Label htmlFor="productId">Product ID</Label>
            <Input
              id="productId"
              value={filters.productId || ''}
              onChange={(e) => onFilterChange({ ...filters, productId: e.target.value || undefined })}
              placeholder="Filter by product ID"
              className="mt-1"
            />
          </div>

          {/* From User Filter */}
          <div>
            <Label htmlFor="fromUser">From User</Label>
            <Input
              id="fromUser"
              value={filters.fromUser || ''}
              onChange={(e) => onFilterChange({ ...filters, fromUser: e.target.value || undefined })}
              placeholder="Sender/From user"
              className="mt-1"
            />
          </div>

          {/* To User Filter */}
          <div>
            <Label htmlFor="toUser">To User</Label>
            <Input
              id="toUser"
              value={filters.toUser || ''}
              onChange={(e) => onFilterChange({ ...filters, toUser: e.target.value || undefined })}
              placeholder="Recipient/To user"
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
} 