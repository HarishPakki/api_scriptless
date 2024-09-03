import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/apiRequestDetails.css';
import '../styles/ProxyAndEnvSettings.css';
import TestDataPopup from './TestDataPopup';
import ProxyAndEnvSettings from './ProxyAndEnvSettings';
import { saveToLocalStorage, getFromLocalStorage, saveSettingsToFile, loadSettingsFromFile } from '../utils/localStorageUtils';

function ApiRequestDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const modifiedRequestsRef = useRef([]);
  const { projectName, apiCollectionName, requests, requestType } = location.state || { projectName: '', apiCollectionName: '', requests: [], requestType: 'json' };
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showProxyEnvPopup, setShowProxyEnvPopup] = useState(false);
  const [settingsType, setSettingsType] = useState(null);
  const [proxySettings, setProxySettings] = useState({});
  const [envVariables, setEnvVariables] = useState([]);
  const [modifiedRequests, setModifiedRequests] = useState([...requests]);

  useEffect(() => {
    if (!projectName || !apiCollectionName || requests.length === 0) {
      navigate('/');
    } else {
      clearSettings();
      loadSettings();
    }
  }, [projectName, apiCollectionName, requests, navigate]);

  const clearSettings = () => {
    setProxySettings({});
    setEnvVariables([]);
  };

  const loadSettings = () => {
    const loadedProxySettings = loadSettingsFromFile(projectName, apiCollectionName, 'proxy');
    const loadedEnvVariables = loadSettingsFromFile(projectName, apiCollectionName, 'envVariables');

    if (loadedProxySettings) {
      setProxySettings(loadedProxySettings);
    }
    if (loadedEnvVariables) {
      setEnvVariables(loadedEnvVariables);
    }
  };

  const extractEndpoint = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (error) {
      console.error('Failed to extract endpoint:', error);
      return '';
    }
  };

  const openTestDataPopup = (request, index, type) => {
    const modifiedRequest = modifiedRequests[index];
    setSelectedRequest({ ...modifiedRequest, index });
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedRequest(null);
    setShowPopup(false);
  };

  const handleSave = (updatedRequest) => {
    const updatedRequests = [...modifiedRequests];
    updatedRequests[selectedRequest.index] = updatedRequest;
    setModifiedRequests(updatedRequests);
    closePopup();
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const updatedRequests = [...modifiedRequests];
      const temp = updatedRequests[index];
      updatedRequests[index] = updatedRequests[index - 1];
      updatedRequests[index - 1] = temp;
      setModifiedRequests(updatedRequests);
    }
  };

  const handleMoveDown = (index) => {
    if (index < modifiedRequests.length - 1) {
      const updatedRequests = [...modifiedRequests];
      const temp = updatedRequests[index];
      updatedRequests[index] = updatedRequests[index + 1];
      updatedRequests[index + 1] = temp;
      setModifiedRequests(updatedRequests);
    }
  };

  const handleSubmitAll = async () => {
    const payload = { projectName, apiCollectionName, requests: modifiedRequests, proxySettings, envVariables };
    try {
      const response = await fetch('http://localhost:5000/save-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Modified requests and settings saved successfully!');
        const folderName = `${projectName}_${apiCollectionName}`;
        saveSettingsToFile(folderName, 'collection.json', modifiedRequests);
        saveSettingsToFile(folderName, 'proxy.json', proxySettings);
        saveSettingsToFile(folderName, 'globalData.json', envVariables);
      } else {
        console.error('Failed to save requests');
      }
    } catch (error) {
      console.error('Error while saving requests:', error);
    }
  };

  const handleGenerateTestCases = async () => {
    setIsGenerating(true);
    setLoadingMessage('We are generating test cases for you, please wait...');
    setLoadingProgress(0);

    try {
      const payload = { projectName, apiCollectionName, requests: [...requests], proxySettings, envVariables };
      const response = await fetch('http://localhost:5000/generate-testcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const { testCases } = await response.json();
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
      setLoadingMessage('');
    }
  };

  const openSettingsPopup = (type) => {
    setSettingsType(type);
    setShowProxyEnvPopup(true);
  };

  const closeSettingsPopup = (settings) => {
    setShowProxyEnvPopup(false);
    if (settings) {
      if (settingsType === 'proxy') {
        setProxySettings(settings.proxy || {});
      } else if (settingsType === 'env') {
        setEnvVariables(settings.envVariables || []);
      }
    }
  };

  return (
    <div className="request-details-container">
      <h1 className="title">Project Name: {projectName}</h1>
      <h2 className="sub-title">API Collection: {apiCollectionName}</h2>

      <div className="top-right-links">
        <Link to="/" className="home-link">Home</Link>
        <a href="#" className="help-link">Need Help?</a>
      </div>

      <div className="button-container">
        <button onClick={handleGenerateTestCases} className="generate-testcase-btn" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Test Cases'}
        </button>
        <button onClick={() => openSettingsPopup('proxy')} className="settings-btn">
          Configure Proxy
        </button>
        <button onClick={() => openSettingsPopup('env')} className="settings-btn">
          Setup Global Variables
        </button>
      </div>

      {isGenerating && (
        <div className="loading-container">
          <div className="loading-bar">
            <div className="loading-progress" style={{ width: `${loadingProgress}%` }}></div>
          </div>
          <p>{loadingMessage}</p>
        </div>
      )}

      <table className="request-details-table">
        <thead>
          <tr>
            <th>Request #</th>
            <th>EndPoint</th>
            <th>Actions</th>
            <th>Reorder</th>
          </tr>
        </thead>
        <tbody>
          {modifiedRequests.length > 0 && modifiedRequests.map((request, index) => (
            <tr key={index}>
              <td>Request {index + 1}</td>
              <td>{extractEndpoint(request.url)}</td>
              <td>
                <button className="edit-testdata-btn" onClick={() => openTestDataPopup(request, index, requestType)}>
                  Edit Test Data
                </button>
              </td>
              <td>
                <button onClick={() => handleMoveUp(index)}>⬆️</button>
                <button onClick={() => handleMoveDown(index)}>⬇️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="button-group">
        <button onClick={handleSubmitAll} className="submit-all-btn">
          Submit All Requests
        </button>
      </div>

      {showPopup && selectedRequest && (
        <TestDataPopup
          request={selectedRequest}
          onClose={closePopup}
          onSave={handleSave}
          requestType={requestType}
       
          />
      )}

      {showProxyEnvPopup && (
        <ProxyAndEnvSettings
          onClose={closeSettingsPopup}
          initialSettings={{ proxy: proxySettings, envVariables }}
          settingsType={settingsType} // Pass the settingsType to differentiate between Proxy and Env
        />
      )}
    </div>
  );
}

export default ApiRequestDetails;
