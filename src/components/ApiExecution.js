import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FaArrowLeft } from 'react-icons/fa'; // Importing an arrow left icon
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
  // Object to store all responses

  let responseStore = {};


  // Method to store responses dynamically
  const storeResponseDynamically = (response, responseName) => {
    responseStore[responseName] = response;
  };


  // Method to dynamically get data from stored responses using a path
  const getDataDynamically = (path) => {
    try {
      // Resolve the dynamic path and access the value
      const value = path.split('.').reduce((acc, part) => {
        const arrayMatch = part.match(/(.+?)\[(\d+)\]/); // Handles array accesses like addresses[0]
        if (arrayMatch) {
          return acc[arrayMatch[1]][parseInt(arrayMatch[2])];
        }
        return acc[part];
      }, responseStore);

      return value;
    } catch (error) {
      console.error('Error accessing dynamic path:', error);
      return null; // Return null if any part of the path is invalid
    }
  };


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
  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => {
      const match = key.match(/\[(\d+)\]/);  // Match array indexes like [0]
      if (match) {
        const index = parseInt(match[1], 10);
        const arrayKey = key.split('[')[0];  // Get the key before the array index
        const array = acc[arrayKey];  // Access the array based on the key
        return Array.isArray(array) ? array[index] : undefined;  // Return the array element
      }
      return acc && acc[key] !== undefined ? acc[key] : undefined;  // Return object property
    }, obj);
  }
  
  function displayJsonStructure(jsonArray) {
    jsonArray.forEach((obj, index) => {
      console.log(`${index}:`);
      Object.keys(obj).forEach(key => {
        console.log(`  ${key}: ${JSON.stringify(obj[key], null, 2)}`);
      });
    });
  }
  
  

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
  function replaceResponsePlaceholders(content, testData) {
    // This function processes the placeholders inside strings or objects
    const processPlaceholders = (str) => {
      // Function to resolve each placeholder (like {{response1.body[0].userId}})
      const resolvePlaceholder = (placeholder) => {
        const strippedPlaceholder = placeholder.slice(2, -2).trim(); // Remove '{{' and '}}'
        const [responseKey, ...pathParts] = strippedPlaceholder.split('.'); // Split by dot notation
  
        // Ensure it's a valid response reference
        if (!responseKey.startsWith('response')) {
          return placeholder; // If not a valid response placeholder, return the original placeholder
        }
  
        const responseIndex = responseKey.replace('response', ''); // Extract the response index (like response1)
        const response = responseStore[`response${responseIndex}`]; // Get the corresponding response from the responseStore
  
        if (!response) {
          console.warn(`Response${responseIndex} not found in responseStore!`);
          return placeholder; // Return the original placeholder if no response found
        }
  
        // Get the value from the response body using the path (e.g., body[0].userId)
        const value = getNestedValue(response.body, pathParts.join('.'));
  
        // Return the resolved value or the original placeholder if not found
        return value !== undefined ? value : placeholder;
      };
  
      // A loop that finds and replaces placeholders in the string
      let result = '';
      let start = 0;
      while (start < str.length) {
        const openIndex = str.indexOf('{{', start); // Find opening {{
        if (openIndex === -1) {
          result += str.slice(start); // Append the rest of the string
          break;
        }
        result += str.slice(start, openIndex); // Append part before {{
        const closeIndex = str.indexOf('}}', openIndex); // Find closing }}
        if (closeIndex === -1) {
          result += str.slice(openIndex); // Append the rest if no closing }}
          break;
        }
        const placeholder = str.slice(openIndex, closeIndex + 2); // Extract placeholder {{...}}
        result += resolvePlaceholder(placeholder); // Resolve the placeholder
        start = closeIndex + 2; // Move to the next part of the string
      }
      return result;
    };
  
    // Helper function to process objects and replace placeholders in string values
    const processObjectPlaceholders = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = processPlaceholders(obj[key]); // Process strings
        } else if (typeof obj[key] === 'object') {
          processObjectPlaceholders(obj[key]); // Recursively process nested objects
        }
      });
      return obj;
    };
  
    // Process content based on its type (string or object)
    if (typeof content === 'string') {
      return processPlaceholders(content);
    } else if (typeof content === 'object') {
      return processObjectPlaceholders(content);
    }
  
    return content; // Return content as is if it's not a string or object
  }
  
  // Helper function to retrieve a nested value from an object (handles deep paths)
  function getNestedValue(obj, path) {
    // Split the path by dot notation and array indices
    const keys = path.split('.').flatMap(key => {
      // This will split by dot but also handle array-like access like 'body[0]'
      const match = key.match(/([^\[\]]+)|(\[\d+\])/g); 
      return match ? match.map(k => k.startsWith('[') ? parseInt(k.slice(1, -1)) : k) : key;
    });
  
    // Traverse the object using the keys
    return keys.reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }
  
  
  const executeRequests = async () => {
    setLoading(true);
    const results = [];
    let responseCounter = 1;

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
        modifiedRequest.url = replaceResponsePlaceholders(modifiedRequest.url, testData);
        log.modifiedUrl = modifiedRequest.url;

        if (modifiedRequest.method === 'POST' && modifiedRequest.body) {
          modifiedRequest.body = replaceResponsePlaceholders((modifiedRequest.body), testData);
          modifiedRequest.body = JSON.stringify(modifiedRequest.body);
        }

        // Update headers with x-acc-op if available
        if (xAccOpId) {
          modifiedRequest.headers['x-acc-op'] = xAccOpId;
        }

        // Check if headers exist before trying to iterate over them
        const headers = {};
        if (modifiedRequest.headers && Array.isArray(modifiedRequest.headers)) {
          modifiedRequest.headers.forEach(header => {
            headers[header.key] = header.value;
          });
        }

        // Execute the request
        try {
          const response = await fetch('http://localhost:5000/api-Trigger', {
            method: 'POST',
            body: JSON.stringify({
              url: modifiedRequest.url,
              method: modifiedRequest.method,
              headers: headers,
              body: modifiedRequest.method === 'POST' ? modifiedRequest.body : undefined,
            }),
            headers: { 'Content-Type': 'application/json' },
          });

          log.status = response.ok ? 'Passed' : 'Failed';

          // Read the response body only once and store it
          const responseBody = await response.json();
          log.response = responseBody; // Store the response

          log.responseStatus = response.status;
          // Store the response dynamically
          storeResponseDynamically(log.response, `response${responseCounter}`);
          responseCounter++;
          if (responseBody && responseBody['x-acc-op']) {
            xAccOpId = responseBody['x-acc-op'];
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
          testCaseResults.push(log);
          break; // Stop further requests in the current test case
        }

        testCaseResults.push(log);
      }
      results.push({ jiraId: testData['Jira-Id'], status: testCaseStatus, logs: testCaseResults });
      console.log('Response store before-- ', responseStore);
      responseStore = {}; // Reset the store for the next test case
      responseCounter = 1; // Reset the counter for the next test case
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

  const goBackToApiTool = () => {
    navigate('/api-tool'); // Redirect to the ApiTool page
  };

  return (
    <div className="execution-page-container">
      {/* Back Button with Icon */}
      <div className="back-button-container">
        <button className="back-btn" onClick={goBackToApiTool}>
          <FaArrowLeft /> Back
        </button>
      </div>

      <h1>API Execution: {collectionName}</h1>

      {/* Home and Need Help Buttons */}
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
