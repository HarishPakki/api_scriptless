import React from 'react';
// import '../styles/logModal.css';

const LogModal = ({ logs, onClose }) => {
  const downloadLogs = () => {
    const content = JSON.stringify(logs,null,2); // Content of the text file
    const fileName = "logs.txt"; // File name

    // Create a Blob from the content
    const blob = new Blob([content], { type: "text/plain" });

    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up the URL object
    URL.revokeObjectURL(link.href);
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style={{backgroundColor:'rgba(0,0,0,0.5'}}>
      <div className="bg-white p-5 rounded-lg max-w-4xl h-min overflow-hidden flex flex-col">
        <h2 className="text-lg font-bold mb-4">Execution Logs</h2>
        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded border border-gray-300 mb-4 overflow-auto flex-grow" style={{maxHeight:"350px",overflow:'auto'}}>
          {logs.map((log, index) => (
            <div key={index} className="mb-4">
              <strong>Request {index + 1}:</strong>
              <p>Original URL: {log.originalUrl}</p>
              <p>Modified URL: {log.modifiedUrl}</p>
              <p>Headers: {JSON.stringify(log.headers, null, 2)}</p>
              <p>Body: {log.body}</p>
              <p>Status: {log.status}</p>
              <p>Error: {log.error || 'None'}</p>
              <hr className="my-2" />
            </div>
          ))}
        </pre>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white rounded px-4 py-2 mt-4 hover:bg-blue-600 transition"
          >
            Close
          </button>
          <button
            onClick={downloadLogs}
            className="bg-blue-500 text-white rounded px-4 py-2 mt-4 hover:bg-blue-600 transition"
          >
            Download
          </button>
        </div>
      </div>
    </div>

  );
};

export default LogModal;
