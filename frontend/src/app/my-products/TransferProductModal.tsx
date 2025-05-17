'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import { UserRole } from '@/types/user';
import { transferProduct } from '@/lib/api/products';
import { apiGet } from '@/lib/api/client';
import { XCircle, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
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
  
  const allowedRoles = TRANSFER_FLOW[userRole] || [];

  useEffect(() => {
    const fetchUserOptions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Replace this with your actual API to get users by role
        const promises = allowedRoles.map(role => 
          apiGet<{success: boolean, data: UserOption[]}>(`/users/by-role/${role}`)
        );
        
        const responses = await Promise.all(promises);
        const allUsers: UserOption[] = [];
        
        responses.forEach(response => {
          if (response.data && Array.isArray(response.data)) {
            allUsers.push(...response.data);
          }
        });
        
        // Sort users alphabetically by name
        allUsers.sort((a, b) => a.name.localeCompare(b.name));
        setUserOptions(allUsers);
      } catch (err) {
        console.error('Error fetching user options:', err);
        setError('Failed to load available recipients. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserOptions();
  }, [allowedRoles]);

  const handleTransfer = async () => {
    if (!selectedUserId) {
      setError('Please select a recipient.');
      return;
    }
    
    setTransferLoading(true);
    setError(null);
    
    try {
      const response = await transferProduct(product.id, selectedUserId);
      
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
                <p className="text-gray-400 text-sm">Quantity: {product.quantity} {product.unit || 'units'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#00ffcc] mb-2">Transfer To</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 text-[#a259ff] animate-spin" />
                </div>
              ) : userOptions.length === 0 ? (
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-200 text-center">
                    No recipients available. Please contact support if you believe this is an error.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {userOptions.map(user => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelectUser(user.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedUserId === user.id
                          ? 'border-[#a259ff] bg-[#a259ff20]'
                          : 'border-[#a259ff40] bg-[#18122B] hover:border-[#a259ff80]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-gray-400">ID: {user.id}</p>
                          <p className="text-sm text-gray-400">Role: {user.role}</p>
                          {user.location && (
                            <p className="text-sm text-gray-400">Location: {user.location}</p>
                          )}
                        </div>
                        {selectedUserId === user.id && (
                          <CheckCircle2 className="h-5 w-5 text-[#00ffcc]" />
                        )}
                      </div>
                    </motion.div>
                  ))}
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