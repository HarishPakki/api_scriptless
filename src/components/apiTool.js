import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/apiTool.css';
import { FaEdit, FaPlay, FaTrashAlt } from 'react-icons/fa'; // Importing icons for Edit, Execute, and Delete

function ApiTool() {
  const [projectName, setProjectName] = useState('');
  const [apiCollectionName, setApiCollectionName] = useState('');
  const [inputFormat, setInputFormat] = useState('Postman Collection');
  const [requests, setRequests] = useState([]);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [savedRequests, setSavedRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const itemsPerPage = 10; // Items per page
  const navigate = useNavigate();

  // Fetch saved requests
  useEffect(() => {
    fetch('http://localhost:5000/get-requests')
      .then((response) => response.json())
      .then((data) => {
        const requestsWithStatus = (data.requests || []).map(req => ({
          ...req,
          executionStatus: req.executionStatus || 'Not Run',  // Ensure executionStatus is never null
        }));
        setSavedRequests(requestsWithStatus);
        setFilteredRequests(requestsWithStatus); // Initialize with all requests
      })
      .catch((error) => console.error('Error fetching saved requests:', error));
  }, []);

  // Handle file upload and processing for different formats
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

          const currentDateTime = new Date().toLocaleString();

          parsedRequests = json.item.map(item => ({
            name: item.name,
            method: item.request.method,
            url: item.request.url.raw,
            headers: item.request.header,
            body: item.request.body ? item.request.body.raw : null,
            responses: item.response || [],
            status: 'Not Run', // Default status
            createdDate: currentDateTime,
            executionStatus: 'Not Run', // Default execution status
          }));
          console.log("Parsed Postman Collection:", parsedRequests);

        } else if (inputFormat === 'Swagger') {
          console.error("Swagger file handling is not yet implemented.");
          alert("Swagger file handling is not yet implemented.");
          return;

        } else if (inputFormat === 'Json File') {
          parsedRequests = json.requests.map(req => ({
            ...req,
            status: 'Not Run', // Default status
            createdDate: new Date().toLocaleString(), // Default created date
            executionStatus: 'Not Run', // Default execution status
          })) || [];
          console.log("Parsed JSON File:", parsedRequests);
        }

        setRequests(parsedRequests);

        // Navigate to request details after project creation
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

  // Submit new project and upload data
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

  // Filter projects
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

  // Handle search
  const handleSearchChange = (event) => {
    const searchText = event.target.value.toLowerCase();
    const filtered = savedRequests.filter(request => 
      request.projectName.toLowerCase().includes(searchText) || 
      request.apiCollectionName.toLowerCase().includes(searchText)
    );
    setFilteredRequests(filtered);
  };

  // Navigate to Execution Page on Edit or Execute
  const handleEditProject = (project, apiCollection) => {
    navigate(`/execution/${project}/${apiCollection}`);
  };

  // Navigate to Execution Page on Execute
  const handleExecuteProject = (project, apiCollection) => {
    navigate(`/execution/${project}/${apiCollection}`);
  };

  // Delete the selected project
  const handleDeleteProject = (projectName) => {
    const updatedRequests = savedRequests.filter((request) => request.projectName !== projectName);
    setSavedRequests(updatedRequests);
    setFilteredRequests(updatedRequests);
    alert(`${projectName} deleted successfully.`);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        <input className="search-bar" type="text" placeholder="Search API Collections..." onChange={handleSearchChange} />
      </div>

      <div className="button-group">
        <button onClick={() => setShowProjectPopup(true)} className="create-btn">
          Create New API Project
        </button>
        <button className="create-btn">
          Create API JSON File with Multiple Requests
        </button>
      </div>

      {/* Project Table */}
      <table className="project-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Project Name</th>
            <th>API Collection Name</th>
            <th>Created Date</th>
            <th>Execution Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((request, index) => (
            <tr key={index}>
              <td>{indexOfFirstItem + index + 1}</td>
              <td>{request.projectName}</td>
              <td>{request.apiCollectionName}</td>
              <td>{request.createdDate}</td>
              <td>{request.executionStatus}</td>
              <td>
                <button onClick={() => handleEditProject(request.projectName, request.apiCollectionName)} className="icon-btn">
                  <FaEdit className="edit-icon" />
                </button>
                <button onClick={() => handleExecuteProject(request.projectName, request.apiCollectionName)} className="icon-btn">
                  <FaPlay className="execute-icon" />
                </button>
                <button onClick={() => handleDeleteProject(request.projectName)} className="icon-btn">
                  <FaTrashAlt className="delete-icon" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(filteredRequests.length / itemsPerPage) }, (_, i) => (
          <button key={i} onClick={() => paginate(i + 1)} className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Project Creation Popup */}
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
