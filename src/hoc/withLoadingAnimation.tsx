import React, { useState, useEffect } from 'react';
import LoadingAnimation from '../components/LoadingAnimation';

interface WithLoadingAnimationOptions {
  /** Minimum loading time in milliseconds to ensure animation is visible */
  minLoadTime?: number;
  /** Custom loading message */
  loadingMessage?: string;
  /** Skip loading for subsequent renders */
  loadOnlyOnce?: boolean;
}

/**
 * Higher-order component that wraps a page component with a loading animation
 * @param WrappedComponent The component to wrap
 * @param options Configuration options for the loading behavior
 */
const withLoadingAnimation = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithLoadingAnimationOptions = {}
) => {
  const {
    minLoadTime = 1200,
    loadingMessage = "Kraunama...",
    loadOnlyOnce = true
  } = options;

  // Use a unique key for localStorage to track if this component was already loaded
  const storageKey = `loaded_${WrappedComponent.displayName || WrappedComponent.name || 'Component'}`;

  const WithLoadingComponent: React.FC<P> = (props) => {
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      // Skip loading if loadOnlyOnce is true and this component was already loaded
      if (loadOnlyOnce && localStorage.getItem(storageKey)) {
        setLoading(false);
        return;
      }
      
      const startTime = Date.now();
      
      // Set a minimum duration for the loading state
      const timer = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);
        
        setTimeout(() => {
          setLoading(false);
          
          // Mark this component as loaded if loadOnlyOnce is true
          if (loadOnlyOnce) {
            localStorage.setItem(storageKey, 'true');
          }
        }, remainingTime);
      }, 100); // Small initial delay for state to settle
      
      return () => clearTimeout(timer);
    }, []);
    
    if (loading) {
      return <LoadingAnimation fullScreen message={loadingMessage} />;
    }
    
    return <WrappedComponent {...props} />;
  };
  
  // Set displayName for debugging
  WithLoadingComponent.displayName = `WithLoading(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithLoadingComponent;
};

export default withLoadingAnimation; 