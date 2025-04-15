import React, { useState, useEffect } from 'react';
import { getCurrentUserId, getShareableUserIdLink } from '../services/supabaseClient';

const UserIdSharing: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Get the current user ID
    const id = getCurrentUserId();
    setUserId(id);
    
    // Generate a shareable link
    const link = getShareableUserIdLink();
    setShareableLink(link);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="user-id-sharing">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-blue-600 hover:text-blue-800 flex items-center mb-1"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-1" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
        {isExpanded ? 'Hide Sync Options' : 'Sync Between Browsers'}
      </button>
      
      {isExpanded && (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4 text-sm">
          <p className="mb-2 text-gray-700">
            To continue your progress on another browser or device, copy this link:
          </p>
          <div className="flex items-center mb-2">
            <input 
              type="text" 
              value={shareableLink} 
              readOnly 
              className="flex-grow p-1 border border-gray-300 rounded-md text-xs mr-2"
            />
            <button 
              onClick={copyToClipboard}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-500 text-xs">
            Open this link in any browser to continue with your progress and stats.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserIdSharing; 