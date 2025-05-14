// Simple toast hook implementation

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple implementation that just logs to console but provides the API expected by the components
export function useToast() {
  const toast = (options: ToastOptions) => {
    console.log('Toast:', options);
    // In a real implementation, this would show a toast notification
  };

  return { toast };
} 