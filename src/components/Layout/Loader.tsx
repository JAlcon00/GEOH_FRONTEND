import React from 'react';

const Loader: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500"></div>
  </div>
);

export default Loader;
