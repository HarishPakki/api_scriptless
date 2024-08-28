import React from 'react';

function FlowDescription({ description, onAccept }) {
  return (
    <div className="p-4 bg-gray-50 border rounded-lg">
      <h5 className="text-lg font-bold">Flow Description</h5>
      <p>{description}</p>
      <button 
        onClick={onAccept} 
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Accept
      </button>
    </div>
  );
}

export default FlowDescription;
