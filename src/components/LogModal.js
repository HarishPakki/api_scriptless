import React from 'react';
import '../styles/logModal.css';

const LogModal = ({ logs, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Execution Logs</h2>
        <pre className="log-details">
          {logs.map((log, index) => (
            <div key={index}>
              <strong>Request {index + 1}:</strong>
              <p>Original URL: {log.originalUrl}</p>
              <p>Modified URL: {log.modifiedUrl}</p>
              <p>Headers: {JSON.stringify(log.headers, null, 2)}</p>
              <p>Body: {log.body}</p>
              <p>Status: {log.status}</p>
              <p>Error: {log.error || 'None'}</p>
              <hr />
            </div>
          ))}
        </pre>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default LogModal;
