import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/apiTool.css';
import ApiTable from './ApiTable';

function ApiTool() {
  const [projectName, setProjectName] = useState('');
  const [apiCollectionName, setApiCollectionName] = useState('');
  const [inputFormat, setInputFormat] = useState('Postman Collection');
  const [requests, setRequests] = useState([]);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [savedRequests, setSavedRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/get-requests')
      .then((response) => response.json())
      .then((data) => {
        setSavedRequests(data.requests || []);
        setFilteredRequests(data.requests || []); // Initialize with all requests
      })
      .catch((error) => console.error('Error fetching saved requests:', error));
  }, []);

  const handleJsonUpload = (file, project, apiCollection) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        let parsedRequests = [];

        if (inputFormat === 'Postman Collection') {
          if (!json.info || !json.item || !json.info._postman_id) {
            console.error("Invalid Postman collection format.");
            alert("This is not a valid Postman collection. Please upload a valid Postman collection file.");
            return;
          }

          parsedRequests = json.item.map(item => ({
            name: item.name,
            method: item.request.method,
            url: item.request.url.raw,
            headers: item.request.header,
            body: item.request.body ? item.request.body.raw : null,
            responses: item.response || [],
            status: 'Not Run' // Default status
          }));
          console.log("Parsed Postman Collection:", parsedRequests);

        } else if (inputFormat === 'Swagger') {
          console.error("Swagger file handling is not yet implemented.");
          alert("Swagger file handling is not yet implemented.");
          return;

        } else if (inputFormat === 'Json File') {
          parsedRequests = json.requests.map(req => ({
            ...req,
            status: 'Not Run' // Default status
          })) || [];
          console.log("Parsed JSON File:", parsedRequests);
        }

        setRequests(parsedRequests);

        navigate(`/request-details/${project}/${apiCollection}`, {
          state: { projectName: project, apiCollectionName: apiCollection, requests: parsedRequests, requestType: inputFormat },
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Failed to parse the uploaded file. Please check the file format.");
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
      alert('Please fill out all fields and upload a file.');
    }
  };

  const handleProjectFilterChange = (event) => {
    const selectedProject = event.target.value;
    setProjectName(selectedProject);

    if (selectedProject === "Select Project") {
      setFilteredRequests(savedRequests);
    } else {
      const filtered = savedRequests.filter(request => request.projectName === selectedProject);
      setFilteredRequests(filtered);
    }
  };

  return (
    <div className="api-tool-container">
      <h1 className="title">Scriptless API Automation Tool</h1>

      <div className="top-controls">
        <div className="dropdown-date-container">
          <select className="dropdown small-dropdown" onChange={handleProjectFilterChange}>
            <option>Select Project</option>
            {[...new Set(savedRequests.map(request => request.projectName))].map((project, index) => (
              <option key={index} value={project}>{project}</option>
            ))}
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

      <ApiTable savedRequests={filteredRequests} />

      {showProjectPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create New API Project</h2>
            <select id="projectName" className="modal-input">
              <option value="">Select Project</option>
              {[...Array(10).keys()].map(i => (
                <option key={i} value={`Project ${i + 1}`}>{`Project ${i + 1}`}</option>
              ))}
            </select>
            <input type="text" id="apiCollectionName" placeholder="API Collection Name" className="modal-input" />

            <div className="form-group">
              <label htmlFor="inputFormat">Select Input Data Format</label>
              <select
                id="inputFormat"
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                className="modal-input"
              >
                <option value="Postman Collection">Postman Collection</option>
                <option value="Swagger">Swagger</option>
                <option value="Json File">Json File</option>
              </select>
            </div>

            <h3>{`Upload ${inputFormat}`}</h3>
            <input type="file" id="jsonFileInput" className="file-input" />
            <div className="modal-buttons">
              <button onClick={handleProjectSubmit} className="modal-btn submit-btn">
                Submit
              </button>
              <button className="modal-btn close-btn" onClick={() => setShowProjectPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiTool;
