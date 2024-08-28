import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/apiExecution.css';

function ApiExecution() {
  const { collectionName } = useParams();
  const [requestDetails, setRequestDetails] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [executionResults, setExecutionResults] = useState([]);

  useEffect(() => {
    // Fetch the JSON file for the selected collection from the backend
    fetch(`http://localhost:5000/get-collection/${collectionName}`)
      .then(response => response.json())
      .then(data => setRequestDetails(data))
      .catch(error => console.error('Error fetching collection details:', error));
  }, [collectionName]);

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

  const executeRequests = () => {
    const results = requestDetails.requests.map((request, index) => {
      const testData = excelData[index];

      // Modify the request with Excel data and execute the API call
      const modifiedRequest = { ...request };
      // Logic to replace body and query parameters with Excel data goes here...

      // For demonstration, assuming it passes
      return { jiraId: testData['Jira Id'], status: 'Passed' };
    });

    setExecutionResults(results);
  };

  return (
    <div className="execution-page-container">
      <h1>API Execution: {collectionName}</h1>

      {requestDetails && (
        <>
          <h3>Requests Details:</h3>
          {requestDetails.requests.map((req, idx) => (
            <div key={idx}>
              <p>{req.url}</p>
              {/* More details about the request */}
            </div>
          ))}

          <h3>Upload Test Data (Excel)</h3>
          <input type="file" onChange={handleExcelUpload} />

          <button onClick={executeRequests} className="execute-btn">Start Execution</button>

          {executionResults.length > 0 && (
            <div className="results-container">
              <h3>Execution Results</h3>
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Jira ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {executionResults.map((result, index) => (
                    <tr key={index} className={result.status === 'Passed' ? 'passed' : 'failed'}>
                      <td>{result.jiraId}</td>
                      <td>{result.status}</td>
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
