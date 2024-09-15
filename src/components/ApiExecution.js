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
  
 
  
  

  // const handleExcelUpload = (e) => {
  //   const file = e.target.files[0];
  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     const data = event.target.result;
  //     const workbook = XLSX.read(data, { type: 'binary' });
  //     const firstSheetName = workbook.SheetNames[0];
  //     const worksheet = workbook.Sheets[firstSheetName];
  //     const jsonData = XLSX.utils.sheet_to_json(worksheet);
  //     setExcelData(jsonData);
  //   };
  //   reader.readAsBinaryString(file);
  // };
// -------------------from Excel
// Parses the Excel data and returns a test data map where the Jira-Id is the key
const parseTestDataFromExcel = (excelData) => {
  const testDataMap = {};

  excelData.forEach(row => {
    const jiraId = row['Jira-Id'];
    testDataMap[jiraId] = row;
  });

  console.log('Parsed Test Data:', testDataMap);
  return testDataMap;
};

/// Helper method to replace values in the body or query params of the request
const replaceInBodyOrQueryParams = (requestData, key, value) => {
  console.log(`Attempting to replace "${key}" in request data...`);

  // Replace in URL query params
  if (requestData.url && requestData.url.includes(key)) {
    const url = new URL(requestData.url);
    url.searchParams.set(key, value);
    requestData.url = url.toString();
    console.log(`Replaced "${key}" in URL. New URL: ${requestData.url}`);
  } else {
    console.log(`Key "${key}" not found in URL: ${requestData.url}`);
  }

  // Replace in body if it's a string (parse it to an object first)
  if (typeof requestData.body === 'string') {
    try {
      const bodyObj = JSON.parse(requestData.body);
      if (bodyObj[key] !== undefined) {
        bodyObj[key] = value;
        requestData.body = JSON.stringify(bodyObj);
        console.log(`Replaced "${key}" in body. New body:`, requestData.body);
      } else {
        console.log(`Key "${key}" not found in body.`);
      }
    } catch (error) {
      console.error(`Failed to parse body as JSON: ${requestData.body}`, error);
    }
  } 
  // If body is already an object
  else if (typeof requestData.body === 'object' && requestData.body[key] !== undefined) {
    requestData.body[key] = value;
    console.log(`Replaced "${key}" in body (object). New body:`, requestData.body);
  } else {
    console.log(`Key "${key}" not found in body.`);
  }

  return requestData;
};

// Replaces test data in the request (URL, body, or query params) dynamically
const replaceTestDataInRequest = (requestData, testData, requestIndex) => {
  console.log(`Processing request ${requestIndex + 1} for test data:`, testData);

  // Loop through each key in the test data and check for placeholders in the request
  for (const key in testData) {
    console.log(`Checking if key "${key}" should replace data in the request...`);

    // Extract request number from the key, like accountId(request1)
    const match = key.match(/\((request\d+)\)/);
    if (match) {
      const testKey = key.split('(')[0]; // Extract the actual key (e.g., accountId, dailyTransferLimit)
      const expectedRequest = match[1]; // Get the expected request number, e.g., request1

      console.log(`Key "${key}" matches "${expectedRequest}"`);

      // Only replace if the current request matches the expected request
      if (`request${requestIndex + 1}` === expectedRequest) {
        const valueToReplace = testData[key];
        console.log(`Replacing "${testKey}" with value "${valueToReplace}" in request ${requestIndex + 1}`);

        // Perform the replacement in the URL query params and request body
        requestData = replaceInBodyOrQueryParams(requestData, testKey, valueToReplace);

        console.log(`Request after replacement:`, requestData);
      } else {
        console.log(`Request index ${requestIndex + 1} does not match "${expectedRequest}", skipping replacement.`);
      }
    }
  }

  console.log(`Final modified request data for request ${requestIndex + 1}:`, requestData);
  return requestData;
};

// Executes the requests using the test data
const executeRequestsWithTestData = (jiraId, requestDetails, testDataMap) => {
  const testData = testDataMap[jiraId];

  if (!testData) {
    console.warn(`No test data found for Jira-Id: ${jiraId}`);
    return requestDetails;
  }

  // Loop through all the requests in the requestDetails and replace the test data dynamically
  requestDetails.requests.forEach((request, index) => {
    console.log(`Processing request ${index + 1} for Jira-Id: ${jiraId}`);
    requestDetails.requests[index] = replaceTestDataInRequest(request, testData, index);
  });

  console.log(`Final modified request details for Jira-Id: ${jiraId}:`, requestDetails);
  return requestDetails;
};

// Handles the Excel file upload
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
    console.log('Excel data parsed and set:', jsonData);
  };
  reader.readAsBinaryString(file);
};

// ----------------------till excel
// ------------------From Response

 function replaceResponsePlaceholders(content, testData) {
  console.log("Starting placeholder replacement for content:", content);
  console.log("Current responseStore contents:", responseStore);

  const processPlaceholders = (str) => {
    console.log("Processing string for placeholders:", str);

    // Function to resolve each placeholder (like {{response1.userId}})
    const resolvePlaceholder = (placeholder) => {
      console.log(`Found placeholder: ${placeholder}`);

      // Trim surrounding {{ }} from the placeholder
      const strippedPlaceholder = placeholder.slice(2, -2).trim();
      console.log(`Stripped placeholder: ${strippedPlaceholder}`);

      // Split by dot notation to extract response and path parts
      const [responseKey, ...pathParts] = strippedPlaceholder.split('.');
      console.log(`Extracted response key: ${responseKey}, path parts: ${pathParts}`);

      // Ensure it's a valid response reference
      if (!responseKey.startsWith('response')) {
        console.warn(`Invalid response reference: ${responseKey}`);
        return placeholder; // Return the original placeholder if it's not valid
      }

      // Extract the response index (e.g., response1 -> 1)
      const responseIndex = responseKey.replace('response', '');
      const response = responseStore[`response${responseIndex}`];
      console.log(`Looking up response${responseIndex} in responseStore...`);

      if (!response) {
        console.warn(`Response${responseIndex} not found in responseStore!`);
        return placeholder; // Return the original placeholder if no response is found
      }

      console.log(`Found response${responseIndex}:`, response);

      // Parse response body if it's a string
      let parsedBody = response.body;
      if (typeof parsedBody === 'string') {
        try {
          parsedBody = JSON.parse(parsedBody); // Parse JSON string into an object
          console.log(`Parsed body for response${responseIndex}:`, parsedBody);
        } catch (e) {
          console.error(`Failed to parse response${responseIndex} body as JSON:`, e);
          return placeholder; // Return the placeholder if parsing fails
        }
      }

      // Get the value from the response body using the path (e.g., userId)
      const value = getNestedValue(parsedBody, pathParts.join('.'));

      if (value !== undefined && typeof value !== 'object') {
        console.log(`Resolved value for ${placeholder}: ${value}`);
        return value; // Return the resolved value
      } else if (typeof value === 'object') {
        console.warn(`Value is an object, extracting first key value from object: ${placeholder}`);
        return extractFirstPrimitiveValue(value);
      } else {
        console.warn(`Value not found in response${responseIndex} for path: ${pathParts.join('.')}`);
        return placeholder; // Return the original placeholder if the value is not found
      }
    };

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
    console.log("Final processed string:", result);
    return result;
  };

  const processObjectPlaceholders = (obj) => {
    console.log("Processing object for placeholders:", obj);
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        console.log(`Processing key: ${key}, value: ${obj[key]}`);
        obj[key] = processPlaceholders(obj[key]); // Process strings
      } else if (typeof obj[key] === 'object') {
        console.log(`Recursively processing nested object for key: ${key}`);
        processObjectPlaceholders(obj[key]); // Recursively process nested objects
      }
    });
    console.log("Final processed object:", obj);
    return obj;
  };

  if (typeof content === 'string') {
    return processPlaceholders(content);
  } else if (typeof content === 'object') {
    return processObjectPlaceholders(content);
  }

  return content; // Return content as is if it's not a string or object
}

function getNestedValue(obj, path) {
  console.log(`Getting nested value from object for path: ${path}`);
  
  const keys = path.split('.').flatMap(key => {
    const match = key.match(/([^\[\]]+)|(\[\d+\])/g);
    return match ? match.map(k => k.startsWith('[') ? parseInt(k.slice(1, -1)) : k) : key;
  });

  console.log(`Resolved keys for path: ${keys}`);

  const result = keys.reduce((acc, key) => {
    if (Array.isArray(acc)) {
      // Handle default to the first item if key is not provided
      return key !== undefined && acc[key] !== undefined ? acc[key] : acc[0];
    }
    return acc && acc[key] !== undefined ? acc[key] : undefined;
  }, obj);

  console.log(`Resolved value for path ${path}:`, result);
  return result;
}

function extractFirstPrimitiveValue(obj) {
  // If obj is an object, iterate over its properties and return the first primitive value
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value !== 'object') {
        console.log(`Extracting first primitive value from object: ${value}`);
        return value;
      }
    }
  }
  console.warn('No primitive value found in object, returning [object Object]');
  return '[object Object]'; // Default if no primitive value is found
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

        modifiedRequest = replaceTestDataInRequest(modifiedRequest, testData, j);


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
