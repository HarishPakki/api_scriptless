import React from 'react';
import '../styles/RequestList.css'; // Importing custom CSS for this component

function RequestList({ requests, setSelectedRequest }) {
  return (
    <div className="request-list">
      {requests.map((request, index) => (
        <div
          key={index}
          className="request-item"
          onClick={() => setSelectedRequest(request)}
        >
          <h3 className="request-title">Configure Request: Request_{index + 1}</h3>
        </div>
      ))}
    </div>
  );
}

export default RequestList;
