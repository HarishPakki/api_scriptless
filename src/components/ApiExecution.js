import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/apiExecution.css';
import LogModal from './LogModal'; // Import a modal component for logs

function ApiExecution() {
  const { projectName, collectionName } = useParams();
  const navigate = useNavigate();
  const [requestDetails, setRequestDetails] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [executionResults, setExecutionResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState(null);
  const [proxySettings, setProxySettings] = useState(null);
  const [envVariables, setEnvVariables] = useState(null);

  useEffect(() => {
    if (!projectName || !collectionName) {
      console.error("Missing projectName or collectionName in URL parameters.");
      return;
    }

    // Load request details
    fetch(`http://localhost:5000/get-collection/${projectName}/${collectionName}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setRequestDetails(data))
      .catch(error => console.error('Error fetching collection details:', error));

    // Load proxy settings and environment variables
    fetch(`http://localhost:5000/get-settings/${projectName}/${collectionName}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setProxySettings(data.proxySettings || null);
        setEnvVariables(data.envVariables || null);
      })
      .catch(error => console.error('Error fetching settings:', error));
  }, [projectName, collectionName]);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(jsonData);
    };
    reader.readAsBinaryString(file);
  };

  const replacePlaceholders = (obj, testData) => {
    if (typeof obj === 'string') {
      Object.keys(testData).forEach(key => {
        obj = obj.replace(new RegExp(`{${key}}`, 'g'), testData[key]);
      });
      return obj;
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        obj[key] = replacePlaceholders(obj[key], testData);
      });
      return obj;
    }
    return obj;
  };

  const executeRequests = async () => {
    setLoading(true);
    const results = [];

    for (let i = 0; i < excelData.length; i++) {
      const testData = excelData[i];
      const testCaseResults = [];
      let testCaseStatus = 'Passed';
      let xAccOpId = '';

      for (let j = 0; j < requestDetails.requests.length; j++) {
        const request = requestDetails.requests[j];
        let modifiedRequest = { ...request };
        const log = { originalUrl: request.url, modifiedUrl: '', headers: request.headers, body: request.body, status: '', response: null };

        // Replace placeholders in the URL and body
        modifiedRequest.url = replacePlaceholders(modifiedRequest.url, testData);
        log.modifiedUrl = modifiedRequest.url;

        if (modifiedRequest.method === 'POST' && modifiedRequest.body) {
          modifiedRequest.body = replacePlaceholders(JSON.parse(modifiedRequest.body), testData);
          modifiedRequest.body = JSON.stringify(modifiedRequest.body);
        }

        // Update headers with x-acc-op if available
        if (xAccOpId) {
          modifiedRequest.headers['x-acc-op'] = xAccOpId;
        }

        // Execute the request
        try {
          const headers = {};
          modifiedRequest.headers.forEach(header => {
            headers[header.key] = header.value
          })
          const response = await fetch(modifiedRequest.url, {
            method: modifiedRequest.method,
            headers: headers,
            body: modifiedRequest.method === 'POST' ? modifiedRequest.body : undefined,
          });

          log.status = response.ok ? 'Passed' : 'Failed';
          log.response = await response.json(); // Capture the response
          log.responseStatus = response.status;

          if (log.response && log.response['x-acc-op']) {
            xAccOpId = log.response['x-acc-op'];
          }

          if (!response.ok) {
            const errorText = await response.text();
            log.error = `Request failed with status ${response.status}: ${errorText}`;
            testCaseStatus = 'Failed';
            break; // Stop further requests in the current test case
          }
        } catch (error) {
          console.error('Error executing request:', error);
          log.status = 'Failed';
          log.error = `Request failed due to an exception: ${error.message}`;
          testCaseStatus = 'Failed';
          break; // Stop further requests in the current test case
        }

        testCaseResults.push(log);
      }

      results.push({ jiraId: testData['Jira-Id'], status: testCaseStatus, logs: testCaseResults });
    }

    setExecutionResults(results);
    setLoading(false);
  };

  const openLogModal = (logs) => {
    setSelectedLogs(logs);
  };

  const closeLogModal = () => {
    setSelectedLogs(null);
  };

  const goToHomePage = () => {
    navigate('/'); // Redirect to the home page
  };

  return (
    <div className="execution-page-container">
      <h1>API Execution: {collectionName}</h1>

      <div className="top-right-links">
        <button className="home-link" onClick={goToHomePage}>Home</button>
        <a href="#" className="help-link">Need Help?</a>
      </div>

      {requestDetails && (
        <>
          <h3>Requests Details:</h3>
          <table className="request-details-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Method</th>
                <th>URL</th>
                <th>Query Params</th>
                <th>Body</th>
              </tr>
            </thead>
            <tbody>
              {requestDetails.requests.map((req, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{req.method}</td>
                  <td>{req.url}</td>
                  <td>{new URL(req.url).searchParams.toString()}</td>
                  <td>{req.body}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Upload Test Data (Excel)</h3>
          <input type="file" onChange={handleExcelUpload} />

          <button onClick={executeRequests} className="execute-btn" disabled={loading}>
            {loading ? 'Executing...' : 'Start Execution'}
          </button>

          {loading && <div className="loading-spinner"></div>}

          {executionResults.length > 0 && (
            <div className="results-container">
              <h3>Execution Results</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Jira ID</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {executionResults.map((result, index) => (
                    <tr key={index} className={result.status === 'Passed' ? 'passed' : 'failed'}>
                      <td>{result.jiraId}</td>
                      <td>{result.status}</td>
                      <td>
                        <button onClick={() => openLogModal(result.logs)}>View Logs</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {selectedLogs && (
        <LogModal logs={selectedLogs} onClose={closeLogModal} />
      )}
    </div>
  );
}

export default ApiExecution;
