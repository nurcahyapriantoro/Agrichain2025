import { getCurrentUser } from '../api/auth';
import { getProductsByOwner } from '../api/products';

interface ToastFunction {
  (props: { title: string; description: string; variant?: 'default' | 'destructive' }): void;
}

/**
 * Fetch products owned by current user
 */
export const fetchProductsByOwner = async (
  setLoadingProducts: (loading: boolean) => void, 
  setProducts: (products: any[]) => void,
  toast?: ToastFunction
) => {
  try {
    setLoadingProducts(true);
    
    // First get current user
    const currentUser = await getCurrentUser();
    const currentUserId = currentUser?.id;

    if (!currentUserId) {
      console.error('User ID not found in session');
      if (toast) {
        toast({
          title: 'Authentication Error',
          description: 'Please login again to access your products.',
          variant: 'destructive',
        });
      }
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    // Fetch products owned by the current user
    console.log(`Fetching products owned by user ID: ${currentUserId}`);
    const response = await getProductsByOwner(currentUserId);
    
    // Process response
    setProducts(response.products || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    setProducts([]);
    if (toast) {
      toast({
        title: 'Error',
        description: 'Failed to load your products. Please try again.',
        variant: 'destructive',
      });
    }
  } finally {
    setLoadingProducts(false);
  }
}; 