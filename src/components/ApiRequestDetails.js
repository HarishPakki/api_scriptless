import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { FaArrowLeft } from 'react-icons/fa'; // Importing back arrow icon
// import '../styles/apiRequestDetails.css';
// import '../styles/ProxyAndEnvSettings.css';
import TestDataPopup from './TestDataPopup';
import ProxyAndEnvSettings from './ProxyAndEnvSettings';
import { saveSettingsToFile, loadSettingsFromFile } from '../utils/localStorageUtils';

function ApiRequestDetails() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [showProceedButton, setShowProceedButton] = useState(false); // Added state for the proceed button
  const [showSuccessPopup, setShowSuccessPopup] = useState({
    title: "",
    content: "",
    show: false
  });

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

  const openTestDataPopup = (request, index) => {
    const modifiedRequest = modifiedRequests[index];
    const bodyData = modifiedRequest.body ? JSON.parse(modifiedRequest.body) : {}; // Parse the body as JSON
    setSelectedRequest({ ...modifiedRequest, index, bodyData }); // Include parsed body data
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
        // alert('Modified requests and settings saved successfully!');
        setShowSuccessPopup({
          title: "Submit Success",
          content: "Modified requests and settings saved successfully!",
          show: true
        });
        const folderName = `${projectName}_${apiCollectionName}`;
        saveSettingsToFile(folderName, 'collection.json', modifiedRequests);
        saveSettingsToFile(folderName, 'proxy.json', proxySettings);
        saveSettingsToFile(folderName, 'globalData.json', envVariables);

        // Show the Proceed button after successful submission
        setShowProceedButton(true); // Enable proceed button here
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

        // alert("Test cases generated and downloaded successfully!");
        setShowSuccessPopup({
          title: "Generate Success",
          content: "Test cases generated and downloaded successfully!",
          show: true
        });
      } else {
        console.error('Failed to generate test cases');
        // alert("Failed to generate test cases.");
        setShowSuccessPopup({
          title: "Generate Failure",
          content: "Failed to generate test cases.",
          show: true
        });
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      // alert("Failed to generate test cases.");
      setShowSuccessPopup({
        title: "Generate Failure",
        content: "Failed to generate test cases.",
        show: true
      });
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

  const proceedToExecution = () => {
    navigate(`/execution/${projectName}/${apiCollectionName}`); // Navigate to the execution page
  };

  const goBackToApiTool = () => {
    navigate('/api-tool'); // Navigate back to ApiTool page
  };

  const hidePopup=()=>{
    setShowSuccessPopup({
      title: "",
      content: "",
      show: false
    });
  }

  const renderPopup=()=>{
    return(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="text-xl font-semibold text-gray-700">{showSuccessPopup.title}</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={()=>hidePopup()}>✕</button>
          </div>
          <div className="mt-4">
            <p className="text-gray-600">
              {showSuccessPopup.content}
            </p>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              onClick={()=>hidePopup()}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-lg border-2 border-gray-300 mx-auto max-w-screen-xl">
      {showSuccessPopup.show && renderPopup()}
       <div className="flex justify-between items-start p-4">
        {/* Back Button */}
        <div className="mb-4">
          <button
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            onClick={goBackToApiTool}
          >
            <FaArrowLeft /> Back
          </button>
        </div>
        <div className="flex justify-end items-start p-4">
          <button
            className="text-blue-600 hover:underline text-sm mr-4"
            onClick={()=>navigate('/')}
          >
            Home
          </button>
          <a href="#" className="text-blue-600 hover:underline text-sm">
            Need Help?
          </a>
        </div>
       </div>

      <h1 className="text-center text-4xl font-bold mb-5 text-white bg-blue-500 py-4 rounded-md border border-blue-700">
        Project Name: {projectName}
      </h1>
      <h2 className="text-center text-2xl text-gray-600 mb-5">
        API Collection: {apiCollectionName}
      </h2>

      {/* <div className="absolute top-5 right-5 space-x-4">
        <Link to="/" className="text-blue-600 hover:underline">
          Home
        </Link>
        <a href="#" className="text-blue-600 hover:underline">
          Need Help?
        </a>
      </div> */}

      <div className="flex flex-wrap justify-between gap-5 mb-5">
        <button
          onClick={handleGenerateTestCases}
          className={`px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md transition ${
            isGenerating
              ? "bg-gray-400 cursor-not-allowed"
              : "hover:bg-blue-700 hover:-translate-y-1"
          }`}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Test Cases"}
        </button>
        <button
          onClick={() => openSettingsPopup("proxy")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-1"
        >
          Configure Proxy
        </button>
        <button
          onClick={() => openSettingsPopup("env")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-1"
        >
          Setup Global Variables
        </button>
      </div>

      {isGenerating && (
        <div className="mb-5 text-center">
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-blue-600 transition-all"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-3 text-gray-600">{loadingMessage}</p>
        </div>
      )}

      <table className="w-full border-collapse rounded-lg border border-gray-300 shadow-md overflow-hidden">
        <thead>
          <tr className="bg-blue-700 text-white text-sm uppercase tracking-wider">
            <th className="py-3 px-4">Request #</th>
            <th className="py-3 px-4">Method</th>
            <th className="py-3 px-4">Endpoint</th>
            <th className="py-3 px-4">Actions</th>
            <th className="py-3 px-4">Reorder</th>
          </tr>
        </thead>
        <tbody>
          {modifiedRequests.map((request, index) => (
            <tr
              key={index}
              className={`${
                index % 2 === 0 ? "bg-gray-50" : "bg-white"
              } hover:bg-blue-100`}
            >
              <td className="py-3 px-4">{index + 1}</td>
              <td className="py-3 px-4">{request.method}</td>
              <td className="py-3 px-4">{extractEndpoint(request.url)}</td>
              <td className="py-3 px-4">
                <button
                  onClick={() => openTestDataPopup(request, index)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Test Data
                </button>
              </td>
              <td className="py-3 px-4 flex items-center space-x-2">
                <button onClick={() => handleMoveUp(index)}>⬆️</button>
                <button onClick={() => handleMoveDown(index)}>⬇️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5">
        <button
          onClick={handleSubmitAll}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-1"
        >
          Submit All Requests
        </button>
      </div>

      {showProceedButton && (
        <div className="mt-5 text-center">
          <button
            onClick={proceedToExecution}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:-translate-y-1"
          >
            Proceed with Execution
          </button>
        </div>
      )}

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
          settingsType={settingsType}
        />
      )}
    </div>

  );
}

export default ApiRequestDetails;
