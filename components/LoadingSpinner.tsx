
import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "" }) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="w-full h-full border-4 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
