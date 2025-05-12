'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI, userAPI } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  UserRole, 
  TransactionActionType, 
  ActionReason, 
  Product, 
  User 
} from '@/types';
import { formatRupiah } from '@/lib/utils';
import { 
  ArrowPathIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CheckCircleIcon, 
  ChevronRightIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  CubeTransparentIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getCachedSession } from '@/lib/api/client';

// Client-side date display component to avoid hydration issues
function DateDisplay() {
  const [dateString, setDateString] = useState<string>('');
  
  useEffect(() => {
    setDateString(new Date().toLocaleDateString());
  }, []);
  
  return <>{dateString}</>;
}

const ProductTransferPage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // Step tracking - start directly at step 2 since product is pre-selected
  const [currentStep, setCurrentStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  
  // Form data
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [receivers, setReceivers] = useState<User[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [actionType, setActionType] = useState<string>(TransactionActionType.TRANSFER);
  const [actionReason, setActionReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Animation controls
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  
  // Loading states
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingReceivers, setLoadingReceivers] = useState(true);

  // Load the specific product based on ID
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setLoadingProduct(true);
        const response = await productAPI.getProductById(productId);
        setSelectedProduct(response);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product. Please try again.',
          variant: 'destructive',
        });
        router.push('/products/transfer');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId, toast, router]);

  // Load potential receivers (users in roles that can receive products)
  useEffect(() => {
    const fetchReceivers = async () => {
      try {
        setLoadingReceivers(true);
        // Get current user to know which roles to include
        const session = await getCachedSession();
        const currentUser = session?.user;
        const currentUserRole = currentUser?.role;
        
        // Define possible receiver roles based on current user role
        let receiverRoles: string[] = [];
        
        switch (currentUserRole) {
          case UserRole.FARMER:
            receiverRoles = [UserRole.COLLECTOR, UserRole.TRADER];
            break;
          case UserRole.COLLECTOR:
            receiverRoles = [UserRole.TRADER, UserRole.RETAILER];
            break;
          case UserRole.TRADER:
            receiverRoles = [UserRole.RETAILER, UserRole.CONSUMER];
            break;
          case UserRole.RETAILER:
            receiverRoles = [UserRole.CONSUMER];
            break;
          default:
            receiverRoles = [
              UserRole.FARMER, 
              UserRole.COLLECTOR,
              UserRole.TRADER,
              UserRole.RETAILER,
              UserRole.CONSUMER
            ];
        }
        
        // Fetch all users for each applicable role
        let allReceivers: User[] = [];
        
        for (const role of receiverRoles) {
          try {
            const response = await userAPI.getUsersByRole(role);
            if (response.users) {
              const usersWithRole = response.users.map((user: User) => ({
                ...user,
                role: role as UserRole
              }));
              allReceivers = [...allReceivers, ...usersWithRole];
            }
          } catch (err) {
            console.warn(`Error fetching ${role} users:`, err);
          }
        }
        
        setReceivers(allReceivers);
      } catch (error) {
        console.error('Error fetching receivers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load potential receivers. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoadingReceivers(false);
      }
    };

    fetchReceivers();
  }, [toast]);

  // Update quantity when product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1); // Reset to 1 when product changes
    }
  }, [selectedProduct]);

  const handleReceiverSelect = (receiverId: string) => {
    setSelectedReceiver(receiverId);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep === 2) {
      // If we're at the first actual step (receiver selection), go back to products
      router.push('/products');
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleTransfer = async () => {
    if (!selectedProduct || !selectedReceiver) return;
    
    setLoading(true);
    
    try {
      // Call the transferProduct API with the required parameters
      await productAPI.transferProduct(selectedProduct.id, selectedReceiver);
      
      setTransferComplete(true);
      toast({
        title: 'Transfer Successful',
        description: 'The product has been transferred successfully.',
        variant: 'default',
      });
      
      // Move to confirmation step
      setCurrentStep(4);
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to transfer the product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedReceiver('');
    setQuantity(1);
    setActionType(TransactionActionType.TRANSFER);
    setActionReason('');
    setNotes('');
    setTransferComplete(false);
    setCurrentStep(2);
  };

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const getActionReasonOptions = () => {
    const reasons = [
      { value: ActionReason.TRANSFER_OWNERSHIP, label: 'Transfer Ownership' },
      { value: ActionReason.QUALITY_ISSUE, label: 'Quality Issue' },
      { value: ActionReason.SAFETY_CONCERN, label: 'Safety Concern' },
      { value: ActionReason.STOCK_UPDATE, label: 'Stock Update' },
      { value: ActionReason.OTHER, label: 'Other' }
    ];
    
    return reasons.map(reason => (
      <SelectItem key={reason.value} value={reason.value}>
        {reason.label}
      </SelectItem>
    ));
  };

  // Render UI based on current step
  const renderCurrentStep = () => {
    if (loadingProduct && currentStep === 2) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading product information...</p>
          </div>
        </div>
      );
    }
    
    switch (currentStep) {
      case 2: // Select Receiver
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Selected Product</h3>
                <div className="mt-2 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                      {selectedProduct?.images && selectedProduct.images.length > 0 ? (
                        <img 
                          src={selectedProduct.images[0]} 
                          alt={selectedProduct.name}
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                          <CubeTransparentIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">{selectedProduct?.name}</h3>
                      <div className="mt-1 flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Quantity: {selectedProduct?.quantity} {selectedProduct?.unit || 'units'}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Price: {formatRupiah(selectedProduct?.price || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Label className="text-lg mb-3 block">Select recipient</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <AnimatePresence>
                  {loadingReceivers ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full flex justify-center items-center py-10"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                        <p className="text-lg text-gray-600 dark:text-gray-300">Loading potential recipients...</p>
                      </div>
                    </motion.div>
                  ) : receivers.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center"
                    >
                      <UserCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Recipients Available</h3>
                      <p className="mt-2 text-gray-500 dark:text-gray-400">There are no users available to receive this product.</p>
                    </motion.div>
                  ) : (
                    receivers.map(receiver => (
                      <motion.div
                        key={receiver.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleReceiverSelect(receiver.id)}
                        className={`relative overflow-hidden rounded-xl border shadow-sm cursor-pointer transition duration-200
                          ${selectedReceiver === receiver.id ? 
                            'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 
                            'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          }
                        `}
                      >
                        <div className="flex items-center p-4">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                            {receiver.profilePicture ? (
                              <img 
                                src={receiver.profilePicture} 
                                alt={receiver.name}
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-base font-medium text-gray-900 dark:text-white">{receiver.name}</h3>
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                                {receiver.role}
                              </span>
                              {receiver.address && (
                                <>
                                  <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{receiver.address}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedReceiver === receiver.id && (
                            <div className="absolute right-4 top-4">
                              <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
              <Button 
                onClick={nextStep}
                disabled={!selectedReceiver || loadingReceivers}
                className="group"
              >
                Continue
                <ChevronRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </motion.div>
        );
      
      case 3: // Transfer Details
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <Label className="text-lg mb-2 block">Transfer Details</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity to Transfer</Label>
                    <div className="flex items-center mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                        disabled={quantity <= 1}
                        className="rounded-r-none"
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={selectedProduct?.quantity || 1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedProduct?.quantity || 1))}
                        className="rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(prev => Math.min(prev + 1, selectedProduct?.quantity || 1))}
                        disabled={quantity >= (selectedProduct?.quantity || 1)}
                        className="rounded-l-none"
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {selectedProduct?.quantity || 0} {selectedProduct?.unit || 'units'}
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="actionType">Action Type</Label>
                    <Select 
                      value={actionType} 
                      onValueChange={setActionType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TransactionActionType.TRANSFER}>Transfer</SelectItem>
                        <SelectItem value={TransactionActionType.SELL}>Sell</SelectItem>
                        <SelectItem value={TransactionActionType.STOCK_OUT}>Stock Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Select 
                      value={actionReason} 
                      onValueChange={setActionReason}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {getActionReasonOptions()}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                      placeholder="Add any additional notes or information about this transfer"
                    />
                  </div>
                </div>
                
                <div>
                  <div 
                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    onMouseEnter={() => setIsPreviewHovered(true)}
                    onMouseLeave={() => setIsPreviewHovered(false)}
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Transfer Preview</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex flex-col space-y-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Product</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct?.name}</span>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="relative z-10 flex justify-between">
                          <motion.div
                            className="flex flex-col items-center"
                            animate={{ y: isPreviewHovered ? -2 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                              <UserCircleIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">You</span>
                          </motion.div>
                          
                          <motion.div 
                            animate={{ 
                              x: isPreviewHovered ? [0, -5, 5, -5, 5, 0] : 0,
                              opacity: isPreviewHovered ? [1, 0.5, 1] : 1
                            }}
                            transition={{ duration: 1.5, repeat: isPreviewHovered ? Infinity : 0 }}
                            className="flex flex-col items-center"
                          >
                            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                              <ArrowRightIcon className="h-5 w-5 text-white" />
                            </div>
                            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">{quantity} {selectedProduct?.unit || 'units'}</span>
                          </motion.div>
                          
                          <motion.div
                            className="flex flex-col items-center"
                            animate={{ y: isPreviewHovered ? -2 : 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                              <UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Recipient</span>
                          </motion.div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-4">
                        <div className="flex items-center">
                          <ClockIcon className="mr-1 h-4 w-4" />
                          <span>
                            <DateDisplay />
                          </span>
                        </div>
                        <div className="flex items-center">
                          <DocumentTextIcon className="mr-1 h-4 w-4" />
                          <span>{actionType}</span>
                        </div>
                      </div>
                      
                      <motion.div 
                        className="mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 rounded-full"
                        style={{ width: '0%' }}
                        animate={{ width: isPreviewHovered ? '100%' : '0%' }}
                        transition={{ duration: 1.5 }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" />
                      Blockchain Verification
                    </h4>
                    <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                      This transfer will be recorded on the blockchain for complete transparency and traceability.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button 
                onClick={handleTransfer}
                disabled={loading || quantity < 1}
                className="relative"
              >
                {loading ? (
                  <>
                    <span className="opacity-0">Transfer Product</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                    </div>
                  </>
                ) : (
                  <>
                    Transfer Product
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        );
      
      case 4: // Success/Confirmation
        return (
          <motion.div 
            className="text-center py-8 space-y-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="mx-auto w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
            >
              <CheckCircleIcon className="h-14 w-14 text-green-600 dark:text-green-400" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Transfer Complete!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-300 max-w-md mx-auto"
            >
              You have successfully transferred {quantity} {selectedProduct?.unit || 'units'} of {selectedProduct?.name}.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-6 flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button variant="outline" onClick={() => router.push('/products')}>
                Back to Products
              </Button>
              <Button onClick={() => router.push('/transactions')}>
                View Transactions
              </Button>
            </motion.div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <Card className="relative overflow-hidden border-0 shadow-lg dark:bg-gray-900/80 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -top-[400px] -left-[300px] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10 blur-3xl"></div>
            <div className="absolute -bottom-[400px] -right-[300px] w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 blur-3xl"></div>
          </div>
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => router.push('/products')}
                  className="mb-2 -ml-2 flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Products
                </Button>
                <CardTitle className="text-3xl font-bold">Transfer Product</CardTitle>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                  Transfer your product securely to another user in the supply chain
                </CardDescription>
              </div>
              {!transferComplete && currentStep < 4 && (
                <div className="hidden sm:flex items-center space-x-1">
                  {[2, 3].map(step => (
                    <React.Fragment key={step}>
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${currentStep === step ? 
                            'bg-blue-500 text-white' : 
                            currentStep > step ? 
                              'bg-green-500 text-white' : 
                              'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {currentStep > step ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          step - 1
                        )}
                      </div>
                      {step < 3 && (
                        <div 
                          className={`w-8 h-0.5
                            ${currentStep > step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                          `}
                        ></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 min-h-[400px]">
            {renderCurrentStep()}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ProductTransferPage; 