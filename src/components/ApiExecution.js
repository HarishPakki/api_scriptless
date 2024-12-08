import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FaArrowLeft } from 'react-icons/fa'; // Importing an arrow left icon
// import '../styles/apiExecution.css';
import LogModal from './LogModal'; // Import a modal component for logs
import { JSONTree } from 'react-json-tree';

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
  const [showJsonTreeModal, setShowJsonTreeModal] = useState(null);
  const [selectedJsonTree,setSelectedJsonTree]=useState(null);
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
    if (obj == null) {
      console.warn("Skipping null or undefined content.");
      return obj; // Skip processing if obj is null or undefined
    }
    
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

  const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: left;
                }
                th {
                    background-color: #f4f4f4;
                }
                .passed{
                  background-color: green; 
                  color: white;
                }
                .failed{
                  background-color: red;
                  color: white;
                }
            </style>
        </head>
        <body>
            <h1>Data Report</h1>
            <table>
                <thead>
                    <tr>
                        <th>Jira ID</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${executionResults
                        .map(
                            (item) => `
                        <tr>
                            <td>${item.jiraId}</td>
                            <td class='${item.status==="Passed" ? 'passed' : 'failed'}'>${item.status}</td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        </body>
        </html>
  `;

  const openResultsPage = () => {
    // Assuming your MochaWesome report is stored in the path below
    // const reportPath = 'http://localhost:5000/reports/mochawesome-report.html';
    // window.open(reportPath, '_blank');
    // Create the HTML content as a string

    // Open a new tab or window
    const newWindow = window.open("", "_blank");

    if (newWindow) {
      // Write the HTML content into the new tab
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const downloadHtmlReport = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "report.html";
    link.click();
    URL.revokeObjectURL(link.href);
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

  const renderJsonTreeModal=()=>{
    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-xl font-semibold text-gray-700">JSON Body</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={()=>{
              setShowJsonTreeModal(false);
              setSelectedJsonTree(null);
            }}>✕</button>
          </div>
          <div className="mt-4">
            <JSONTree data={JSON.parse(selectedJsonTree)} invertTheme={true} theme={{
              scheme: 'monokai',
              author: 'wimer hazenberg (http://www.monokai.nl)',
              base00: '#272822',
              base01: '#383830',
              base02: '#49483e',
              base03: '#75715e',
              base04: '#a59f85',
              base05: '#f8f8f2',
              base06: '#f5f4f1',
              base07: '#f9f8f5',
              base08: '#f92672',
              base09: '#fd971f',
              base0A: '#f4bf75',
              base0B: '#a6e22e',
              base0C: '#a1efe4',
              base0D: '#66d9ef',
              base0E: '#ae81ff',
              base0F: '#cc6633',
            }} />
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              onClick={()=>{
                setShowJsonTreeModal(false);
                setSelectedJsonTree(null);
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-300 mx-auto max-w-full w-full relative">
      <div className="flex justify-between items-start p-4">
        {/* Back Button with Icon */}
        <div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            onClick={goBackToApiTool}
          >
            <FaArrowLeft /> Back
          </button>
        </div>
        {/* Home and Need Help Buttons */}
        <div className="flex justify-end items-start p-4">
          <button
            className="text-blue-600 hover:underline text-sm mr-4"
            onClick={goToHomePage}
          >
            Home
          </button>
          <a href="#" className="text-blue-600 hover:underline text-sm">
            Need Help?
          </a>
        </div>
      </div>


      <h1 className="text-center text-2xl font-bold text-white bg-blue-500 py-2 px-4 rounded-lg border border-blue-700 mb-6">
        API Execution: {collectionName}
      </h1>



      {requestDetails && (
        <>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Requests Details:
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 bg-gray-100 rounded-lg">
              <thead>
                <tr className="bg-gray-800 text-white uppercase text-sm">
                  <th className="p-2 border border-gray-400">#</th>
                  <th className="p-2 border border-gray-400">Method</th>
                  <th className="p-2 border border-gray-400">URL</th>
                  <th className="p-2 border border-gray-400">Query Params</th>
                  <th className="p-2 border border-gray-400">Body</th>
                </tr>
              </thead>
              <tbody>
                {requestDetails.requests.map((req, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'
                    } hover:bg-gray-300 transition-colors`}
                  >
                    <td className="p-2 border border-gray-300">{idx + 1}</td>
                    <td className="p-2 border border-gray-300">{req.method}</td>
                    <td className="p-2 border border-gray-300">{req.url}</td>
                    <td className="p-2 border border-gray-300">
                      {new URL(req.url).searchParams.toString()}
                    </td>
                    {/* <td className="p-2 border border-gray-300">{req.body}</td> */}
                    <td className="p-2 border border-gray-300">
                      <button className='text-blue-500 hover:underline focus:outline-none' onClick={()=>{
                        setSelectedJsonTree(req.body);
                        setShowJsonTreeModal(true);
                      }}>Show JSON Body</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">
            Upload Test Data (Excel)
          </h3>
          <input
            type="file"
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
            onChange={handleExcelUpload}
          />

          <button
            onClick={executeRequests}
            className={`mt-4 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg font-semibold ${
              loading ? 'cursor-not-allowed opacity-50' : 'hover:bg-green-600'
            } transition-transform transform active:scale-95`}
            disabled={loading}
          >
            {loading ? 'Executing...' : 'Start Execution'}
          </button>

          {loading && (
            // <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mt-6"></div>
            <div class="flex items-center justify-center min-h-screen">
              <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div>
            </div>
          )}

          {executionResults.length > 0 && (
            <div className="mt-6">
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Execution Results
                  </h3>
                </div>
                <div className='flex justify-between items-center gap-2'>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                    onClick={openResultsPage}
                  >
                    View Results
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                    onClick={downloadHtmlReport}
                  >
                    Download Results
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-lg">
                  <thead>
                    <tr className="bg-blue-500 text-white">
                      <th className="p-2 border border-gray-400">Jira ID</th>
                      <th className="p-2 border border-gray-400">Status</th>
                      <th className="p-2 border border-gray-400">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionResults.map((result, index) => (
                      <tr
                        key={index}
                        // className={`${
                        //   result.status === 'Passed'
                        //     ? 'bg-green-500 text-white'
                        //     : 'bg-red-500 text-white'
                        // }`}
                      >
                        <td className="p-2 border border-gray-300">
                          {result.jiraId}
                        </td>
                        <td className={`p-2 border border-gray-300 ${result.status === 'Passed' ? 'bg-green-400 text-white' : 'bg-red-400 text-white'}`}>
                          {result.status}
                        </td>
                        <td className="p-2 border border-gray-300">
                          <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md mr-2"
                            onClick={() => openLogModal(result.logs)}
                          >
                            View Logs
                          </button>
                          {/* <button
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                            onClick={openResultsPage}
                          >
                            View Results
                          </button> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {selectedLogs && <LogModal logs={selectedLogs} onClose={closeLogModal} />}
      {showJsonTreeModal && renderJsonTreeModal()}
    </div>
  );
}

export default ApiExecution;
