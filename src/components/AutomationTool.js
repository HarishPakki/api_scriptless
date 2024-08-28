  import React, { useState } from 'react';
  import FileUpload from './FileUpload';
  import TestDataPopup from './TestDataPopup';
  import '../styles/AutomationTool.css';

  function AutomationTool() {
    const [projectName, setProjectName] = useState('');
    const [apiCollectionName, setApiCollectionName] = useState('');
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const handleJsonUpload = (file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          setRequests(json.requests || []);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          alert("Failed to parse the uploaded JSON. Please check the file format.");
        }
      };
      reader.readAsText(file);
    };

    const openRequestPopup = (request, index) => {
      setSelectedRequest({ ...request, index });
      setShowPopup(true);
    };

    const closePopup = () => {
      setSelectedRequest(null);
      setShowPopup(false);
    };

    const saveRequestData = (updatedData) => {
      setRequests((prevRequests) =>
        prevRequests.map((req, index) =>
          index === selectedRequest.index ? { ...req, ...updatedData } : req
        )
      );
      closePopup();
    };

    const handleCreateCollection = () => {
      const project = prompt("Enter Project Name:");
      const apiCollection = prompt("Enter API Collection Name:");
      if (project && apiCollection) {
        setProjectName(project);
        setApiCollectionName(apiCollection);
      }
    };

    const submitAllRequests = () => {
      const jsonToSave = {
        projectName,
        apiCollectionName,
        requests,
      };

      const blob = new Blob([JSON.stringify(jsonToSave, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${apiCollectionName}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert("API collection saved successfully!");
    };

    return (
      <div className="automation-tool-container">
        <h1 className="title">Scriptless API Automation Tool</h1>

        {/* Display API Collection and Project Name */}
        {projectName && apiCollectionName ? (
          <>
            <h2 className="section-title">{projectName}</h2>
            <h3 className="sub-section-title">API Collection: {apiCollectionName}</h3>
          </>
        ) : (
          <button onClick={handleCreateCollection} className="create-collection-btn">
            Create New API Collection
          </button>
        )}

        {/* Upload JSON */}
        {projectName && apiCollectionName && (
          <div className="upload-section">
            <h2 className="section-title">Upload API Collection</h2>
            <FileUpload onUpload={handleJsonUpload} />
          </div>
        )}

        {/* Display JSON Requests */}
        {requests.length > 0 && (
          <div className="request-list">
            <h3>Requests in API Collection</h3>
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Request URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr key={index}>
                    <td>{request.url}</td>
                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() => openRequestPopup(request, index)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Submit Button */}
            <button onClick={submitAllRequests} className="submit-btn">
              Submit All Requests
            </button>
          </div>
        )}

        {/* Popup for Viewing/Editing Test Data */}
        {showPopup && selectedRequest && (
          <TestDataPopup
            request={selectedRequest}
            apiCollectionName={apiCollectionName}
            onClose={closePopup}
            onSave={saveRequestData}
          />
        )}
      </div>
    );
  }

  export default AutomationTool;
