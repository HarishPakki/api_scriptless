import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/apiExecution.css';

function ApiExecution() {
  const { projectName, collectionName } = useParams();
  const [requestDetails, setRequestDetails] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [executionResults, setExecutionResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectName || !collectionName) {
      console.error("Missing projectName or collectionName in URL parameters.");
      return;
    }

    fetch(`http://localhost:5000/get-collection/${projectName}/${collectionName}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setRequestDetails(data))
      .catch(error => console.error('Error fetching collection details:', error));
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

  const executeRequests = async () => {
    setLoading(true);
    const results = [];

    for (let i = 0; i < excelData.length; i++) {
      const testData = excelData[i];
      const testCaseResults = [];
      let testCaseStatus = 'Passed';

      for (let j = 0; j < requestDetails.requests.length; j++) {
        const request = requestDetails.requests[j];
        let modifiedRequest = { ...request };
        const log = { originalUrl: request.url, modifiedUrl: '', headers: request.headers, body: request.body, status: '' };

        // Replace placeholders in the URL
        Object.keys(testData).forEach(key => {
          modifiedRequest.url = modifiedRequest.url.replace(new RegExp(`{${key}}`, 'g'), testData[key]);
        });

        log.modifiedUrl = modifiedRequest.url;

        // Replace placeholders in the body if it's a POST request
        if (modifiedRequest.method === 'POST' && modifiedRequest.body) {
          let body = JSON.parse(modifiedRequest.body);
          Object.keys(testData).forEach(key => {
            if (body[key] !== undefined) {
              body[key] = testData[key];
            }
          });
          modifiedRequest.body = JSON.stringify(body);
        }

        // Execute the request
        try {
          const response = await fetch(modifiedRequest.url, {
            method: modifiedRequest.method,
            headers: modifiedRequest.headers,
            body: modifiedRequest.method === 'POST' ? modifiedRequest.body : undefined,
          });

          log.status = response.ok ? 'Passed' : 'Failed';
          if (!response.ok) {
            const errorText = await response.text();
            log.error = `Request failed with status ${response.status}: ${errorText}`;
            testCaseStatus = 'Failed';
          }
        } catch (error) {
          console.error('Error executing request:', error);
          log.status = 'Failed';
          log.error = `Request failed due to an exception: ${error.message}`;
          testCaseStatus = 'Failed';
        }

        testCaseResults.push(log);
      }

      results.push({ jiraId: testData['Jira-Id'], status: testCaseStatus, logs: testCaseResults });
    }

    setExecutionResults(results);
    setLoading(false);
  };

  const openLogPopup = (logs) => {
    const logDetails = logs.map((log, index) => `
      Request ${index + 1}:
      Original URL: ${log.originalUrl}
      Modified URL: ${log.modifiedUrl}
      Headers: ${JSON.stringify(log.headers, null, 2)}
      Body: ${log.body}
      Status: ${log.status}
      Error: ${log.error || 'None'}
    `).join('\n\n');

    alert(`Request Log:\n${logDetails}`);
  };

  return (
    <div className="execution-page-container">
      <h1>API Execution: {collectionName}</h1>

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
                        <button onClick={() => openLogPopup(result.logs)}>View Logs</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ApiExecution;
