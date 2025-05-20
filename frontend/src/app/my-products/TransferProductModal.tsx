'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Product } from '@/types/product';
import { UserRole } from '@/types/user';
import { transferProduct } from '@/lib/api/products';
import { getUsersByRole } from '@/lib/api/users';
import { XCircle, CheckCircle2, Loader2, AlertTriangle, Search, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Define allowed transfer flows based on user roles
const TRANSFER_FLOW = {
  [UserRole.FARMER]: [UserRole.COLLECTOR],
  [UserRole.COLLECTOR]: [UserRole.TRADER],
  [UserRole.TRADER]: [UserRole.RETAILER],
  [UserRole.RETAILER]: [],
  [UserRole.CONSUMER]: [],
};

interface UserOption {
  id: string;
  name: string;
  role: string;
  location?: string;
  companyName?: string;
}

interface TransferProductModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
  userRole: UserRole;
}

export default function TransferProductModal({
  product,
  onClose,
  onSuccess,
  userRole
}: TransferProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fromUserId, setFromUserId] = useState<string>('');
  
  // Get the allowed role for transfer based on current user role
  const targetRole = TRANSFER_FLOW[userRole]?.[0] || null;

  // Format role for display
  const formatRoleTitle = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() + 's';
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get from session
      const sessionData = JSON.parse(sessionStorage.getItem('session') || '{}');
      let userId = sessionData?.user?.id;
      
      // If not available, try wallet auth
      if (!userId) {
        const walletUserData = JSON.parse(localStorage.getItem('walletUserData') || '{}');
        userId = walletUserData?.id;
      }
      
      if (userId) {
        setFromUserId(userId);
      }
    }
  }, []);

  useEffect(() => {
    const fetchUserOptions = async () => {
      if (!targetRole) {
        setUserOptions([]);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch users of the target role
        const response = await getUsersByRole(targetRole);
        console.log('Users by role response:', response);
        
        if (response && response.data && Array.isArray(response.data)) {
          // Sort users alphabetically by name
          const sortedUsers = [...response.data].sort((a, b) => a.name.localeCompare(b.name));
          setUserOptions(sortedUsers);
          console.log('Setting user options:', sortedUsers);
        } else {
          console.warn('Unexpected response format:', response);
          setUserOptions([]);
        }
      } catch (err) {
        console.error('Error fetching user options:', err);
        setError('Failed to load available recipients. Please try again.');
        setUserOptions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserOptions();
  }, [targetRole]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return userOptions;
    
    const query = searchQuery.toLowerCase();
    return userOptions.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.id.toLowerCase().includes(query) ||
      (user.companyName && user.companyName.toLowerCase().includes(query))
    );
  }, [userOptions, searchQuery]);

  const handleTransfer = async () => {
    if (!selectedUserId) {
      setError('Please select a recipient.');
      return;
    }
    
    if (!fromUserId) {
      setError('Unable to determine your user ID. Please refresh the page and try again.');
      return;
    }
    
    setTransferLoading(true);
    setError(null);
    
    try {
      // Pass fromUserId as third parameter and userRole as fourth parameter
      const response = await transferProduct(product.id, selectedUserId, fromUserId, userRole);
      
      // Show success state
      setSuccess(true);
      
      // Notify parent component after small delay for animation
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error transferring product:', err);
      setError(err.response?.data?.message || 'Failed to transfer product. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };


  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsDropdownOpen(false);
    
    // Find the selected user and update the input value
    const selected = userOptions.find(user => user.id === userId);
    if (selected) {
      setSearchQuery(selected.name);
    }
  };

  // Get details of selected user if any
  const selectedUser = userOptions.find(user => user.id === selectedUserId);

  return (
    <Dialog open={true} onOpenChange={success ? undefined : onClose}>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-[#232526] to-[#18122B] border-2 border-[#a259ff] shadow-[0_0_30px_#a259ff33] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-[#a259ff40]">
            <h2 className="text-xl font-bold font-orbitron bg-gradient-to-r from-[#a259ff] to-[#00ffcc] bg-clip-text text-transparent">
              Transfer Product
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6 flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#00ffcc] mb-2">Product Details</h3>
              <div className="bg-[#18122B] rounded-lg p-4 border border-[#a259ff40]">
                <p className="text-white font-medium mb-1">{product.name}</p>
                <p className="text-gray-400 text-sm mb-1">ID: {product.id}</p>
                <p className="text-gray-400 text-sm">Quantity: {product.quantity} {product.metadata?.unit || 'units'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#00ffcc] mb-2">
                Transfer To {targetRole ? formatRoleTitle(targetRole) : ''}
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 text-[#a259ff] animate-spin" />
                </div>
              ) : !targetRole ? (
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-200 text-center">
                    Your role cannot transfer products in the supply chain.
                  </p>
                </div>
              ) : userOptions.length === 0 ? (
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-200 text-center">
                    No recipients available. Please contact support if you believe this is an error.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Searchable Dropdown */}
                  <div className="relative mb-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={`Search ${formatRoleTitle(targetRole)}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full bg-[#18122B] border-2 border-[#a259ff40] focus:border-[#a259ff] text-white py-2 pl-10 rounded-lg"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      {selectedUser && (
                        <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#00ffcc]" />
                      )}
                    </div>
                    
                    {/* Dropdown */}
                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-[#232526] border-2 border-[#a259ff40] rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length === 0 ? (
                          <div className="px-4 py-2 text-gray-400 text-center">
                            No matching {formatRoleTitle(targetRole)}
                          </div>
                        ) : (
                          filteredUsers.map(user => (
                            <div
                              key={user.id}
                              onClick={() => handleSelectUser(user.id)}
                              className={`px-4 py-3 cursor-pointer transition-all ${
                                selectedUserId === user.id
                                  ? 'bg-[#a259ff20]'
                                  : 'hover:bg-[#18122B]'
                              }`}
                            >
                              <div className="flex items-center">
                                <UserCircle className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <p className="font-medium text-white">{user.name}</p>
                                  <div className="flex text-xs text-gray-400">
                                    <span className="mr-2">ID: {user.id}</span>
                                    {user.companyName && (
                                      <span className="ml-2">{user.companyName}</span>
                                    )}
                                  </div>
                                </div>
                                {selectedUserId === user.id && (
                                  <CheckCircle2 className="h-5 w-5 text-[#00ffcc] ml-auto" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Close dropdown when clicking outside */}
                  {isDropdownOpen && (
                    <div 
                      className="fixed inset-0 z-0"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                  )}
                </div>
              )}
            </div>
            
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-lg border border-[#00ffcc40] bg-[#00ffcc10]"
              >
                <h4 className="text-[#00ffcc] font-medium mb-1">Transfer Summary</h4>
                <p className="text-gray-300 text-sm">
                  You are about to transfer <span className="font-medium">{product.name}</span> to <span className="font-medium">{selectedUser.name}</span> ({selectedUser.role}).
                </p>
                {selectedUser.companyName && (
                  <p className="text-gray-400 text-sm mt-1">
                    Company: {selectedUser.companyName}
                  </p>
                )}
                {selectedUser.location && (
                  <p className="text-gray-400 text-sm mt-1">
                    Location: {selectedUser.location}
                  </p>
                )}
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-900/30 border border-green-500 rounded-lg p-4 flex items-center justify-center"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-200">Product transferred successfully!</p>
              </motion.div>
            )}
          </div>

          <div className="p-6 border-t border-[#a259ff40] flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff20]"
              disabled={transferLoading || success}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!selectedUserId || transferLoading || success}
              className="bg-gradient-to-r from-[#a259ff] to-[#00ffcc] text-black font-bold hover:opacity-90 min-w-[100px]"
            >
              {transferLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : success ? (
                "Transferred!"
              ) : (
                "Transfer"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </Dialog>
  );
} 