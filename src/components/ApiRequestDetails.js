import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/apiRequestDetails.css';
import TestDataPopup from './TestDataPopup';

function ApiRequestDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const modifiedRequestsRef = useRef([]);
  const { projectName, apiCollectionName, requests } = location.state || { projectName: '', apiCollectionName: '', requests: [] };
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (!projectName || !apiCollectionName || requests.length === 0) {
      navigate('/');
    } else {
      modifiedRequestsRef.current = [...requests];
    }
  }, [projectName, apiCollectionName, requests, navigate]);

  const extractEndpoint = (url) => {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  };

  const openTestDataPopup = (request, index) => {
    const modifiedRequest = modifiedRequestsRef.current[index];
    setSelectedRequest({ ...modifiedRequest, index });
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedRequest(null);
    setShowPopup(false);
  };

  const handleSave = (updatedRequest) => {
    modifiedRequestsRef.current[selectedRequest.index] = updatedRequest;
    closePopup();
  };

  const handleSubmitAll = async () => {
    const payload = { projectName, apiCollectionName, requests: modifiedRequestsRef.current };
    try {
      const response = await fetch('http://localhost:5000/save-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Modified requests saved successfully!');
      } else {
        console.error('Failed to save requests');
      }
    } catch (error) {
      console.error('Error while saving requests:', error);
    }
  };

  const handleGenerateTestCases = async () => {
    setIsGenerating(true);
    
    try {
      // Send the request to the backend to generate test cases
      const payload = { projectName, apiCollectionName, requests };

      const response = await fetch('http://localhost:5000/generate-testcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const { testCases } = await response.json();

        // Convert the received test cases into an Excel format
        const worksheet = XLSX.utils.json_to_sheet(testCases);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases');
        XLSX.writeFile(workbook, `${projectName}_${apiCollectionName}_TestCases.xlsx`);

        alert("Test cases generated and downloaded successfully!");
      } else {
        console.error('Failed to generate test cases');
        alert("Failed to generate test cases.");
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      alert("Failed to generate test cases.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="request-details-container">
      <h1 className="title">Project Name: {projectName}</h1>
      <h2 className="sub-title">API Collection: {apiCollectionName}</h2>

      {isGenerating && (
        <div className="loading">
          <p>We are generating test cases for you, please wait...</p>
        </div>
      )}

      <table className="request-details-table">
        <thead>
          <tr>
            <th>Request #</th>
            <th>EndPoint</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? (
            requests.map((request, index) => (
              <tr key={index}>
                <td>Request {index + 1}</td>
                <td>{extractEndpoint(request.url)}</td>
                <td>
                  <button className="view-testdata-btn" onClick={() => openTestDataPopup(request, index)}>
                    View Test Data
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No requests available</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="button-group">
        <button onClick={handleSubmitAll} className="submit-all-btn">
          Submit All Requests
        </button>
        <button onClick={handleGenerateTestCases} className="generate-testcase-btn" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Test Cases'}
        </button>
      </div>

      {showPopup && selectedRequest && (
        <TestDataPopup
          request={selectedRequest}
          onClose={closePopup}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default ApiRequestDetails;
