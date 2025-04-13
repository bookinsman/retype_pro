import React from 'react';
import withLoadingAnimation from '../hoc/withLoadingAnimation';

interface ExamplePageProps {
  title?: string;
}

// This is a simple example page component
const ExamplePage: React.FC<ExamplePageProps> = ({ title = "Example Page" }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-cormorant font-bold text-gray-800 mb-6">{title}</h1>
      <div className="max-w-2xl bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700 font-baskerville mb-4">
          This is an example page that demonstrates how to use the withLoadingAnimation HOC.
          When this page loads, it will first show the loading animation for at least 1.2 seconds
          before showing the actual content.
        </p>
        <p className="text-gray-700 font-baskerville">
          To use this pattern on any new page, simply wrap your page component with the 
          withLoadingAnimation HOC and customize the loading options as needed.
        </p>
      </div>
    </div>
  );
};

// Export the component wrapped with the loading animation HOC
export default withLoadingAnimation(ExamplePage, {
  loadingMessage: "Pavyzdys kraunamas...",
  minLoadTime: 1500 // Longer loading time for demonstration purposes
});

// For pages that need to specify their own loading state, you can also export the 
// unwrapped component to use elsewhere
export { ExamplePage }; 