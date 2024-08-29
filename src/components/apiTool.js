import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/apiTool.css';
import ApiTable from './ApiTable';

function ApiTool() {
  const [projectName, setProjectName] = useState('');
  const [apiCollectionName, setApiCollectionName] = useState('');
  const [requests, setRequests] = useState([]);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [savedRequests, setSavedRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/get-requests')
      .then((response) => response.json())
      .then((data) => setSavedRequests(data.requests || []))
      .catch((error) => console.error('Error fetching saved requests:', error));
  }, []);

  const handleJsonUpload = (file, project, apiCollection) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const parsedRequests = json.requests || [];
        setRequests(parsedRequests);

        navigate(`/request-details/${project}/${apiCollection}`, {
          state: { projectName: project, apiCollectionName: apiCollection, requests: parsedRequests },
        });
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        alert("Failed to parse the uploaded JSON. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleProjectSubmit = () => {
    const project = document.getElementById('projectName').value;
    const apiCollection = document.getElementById('apiCollectionName').value;
    const fileInput = document.getElementById('jsonFileInput');

    if (project && apiCollection && fileInput.files.length > 0) {
      setProjectName(project);
      setApiCollectionName(apiCollection);
      handleJsonUpload(fileInput.files[0], project, apiCollection);
      setShowProjectPopup(false);
    } else {
      alert('Please fill out all fields and upload a JSON file.');
    }
  };

  return (
    <div className="api-tool-container">
      <h1 className="title">Scriptless API Automation Tool</h1>

      <div className="top-controls">
        <div className="dropdown-date-container">
          <select className="dropdown small-dropdown">
            <option>Select Project</option>
            <option>Project 1</option>
            <option>Project 2</option>
          </select>
          <label className="date-label">Start Date</label>
          <input type="date" className="date-input" />
          <label className="date-label">End Date</label>
          <input type="date" className="date-input" />
        </div>
        <input className="search-bar" type="text" placeholder="Search API Collections..." />
      </div>

      <div className="button-group">
        <button onClick={() => setShowProjectPopup(true)} className="create-btn">
          Create New API Project
        </button>
        <button className="create-btn">
          Create API JSON File with Multiple Requests
        </button>
      </div>

      <ApiTable savedRequests={savedRequests} />

      {showProjectPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New API Project</h2>
            <input type="text" id="projectName" placeholder="Project Name" className="modal-input" />
            <input type="text" id="apiCollectionName" placeholder="API Collection Name" className="modal-input" />
            <h3>Upload API Collection JSON</h3>
            <input type="file" id="jsonFileInput" className="file-input" />
            <div className="modal-buttons">
              <button onClick={handleProjectSubmit} className="modal-btn submit-btn">
                Submit
              </button>
              <button className="modal-btn close-btn" onClick={() => setShowProjectPopup(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiTool;
