// filepath: c:\WORK_win\lyrics-syncer\frontend\src\components\DeleteCacheButton.js
import React, { useState } from 'react';

const DeleteCacheButton = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState(null);

  const handleDeleteCache = async () => {
    if (window.confirm('Are you sure you want to delete all cached files? This will remove all downloaded audio files, lyrics, and debug logs.')) {
      try {
        setIsDeleting(true);
        setResult(null);
        
        const response = await fetch('http://localhost:3001/api/delete_cache', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete cache');
        }

        const data = await response.json();
        setResult(data);
        setTimeout(() => setResult(null), 5000); // Clear the result after 5 seconds
      } catch (error) {
        setResult({ success: false, error: error.message });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <button 
        onClick={handleDeleteCache}
        disabled={isDeleting}
        style={{ 
          padding: '8px 16px',
          backgroundColor: '#ff4d4d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isDeleting ? 'not-allowed' : 'pointer'
        }}
      >
        {isDeleting ? 'Deleting cache...' : 'Delete Cache Files'}
      </button>
      
      {result && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          borderRadius: '4px',
          color: result.success ? '#155724' : '#721c24'
        }}>
          {result.success ? (
            <div>
              <p><strong>Cache successfully cleared!</strong></p>
              <ul style={{ margin: '5px 0', padding: '0 0 0 20px' }}>
                {result.results.map((item, index) => (
                  <li key={index}>{item.folder}: {item.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Failed to delete cache: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeleteCacheButton;