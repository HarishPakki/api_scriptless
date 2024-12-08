import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import '../styles/apiTool.css';
import { FaEdit, FaPlay, FaSort, FaSortDown, FaSortUp, FaTrashAlt } from 'react-icons/fa'; // Importing icons for Edit, Execute, and Delete

function ApiTool() {
  const [projectName, setProjectName] = useState('');
  const [apiCollectionName, setApiCollectionName] = useState('');
  const [inputFormat, setInputFormat] = useState('Postman Collection');
  const [requests, setRequests] = useState([]);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [savedRequests, setSavedRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "createdDate", direction: "descending" }); // Sorting state
  const itemsPerPage = 10; // Items per page
  const navigate = useNavigate();

  // Fetch saved requests
  useEffect(() => {
    fetch('http://localhost:5000/get-requests')
      .then((response) => response.json())
      .then((data) => {
        let requestsWithStatus = (data.requests || []).map(req => ({
          ...req,
          executionStatus: req.executionStatus || 'Not Run',  // Ensure executionStatus is never null
        }));
        requestsWithStatus.sort((a,b)=>new Date(b.createdDate)-new Date(a.createdDate));
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
          // if (!json.info || !json.item || !json.info._postman_id) {
          //   console.error("Invalid Postman collection format.");
          //   alert("This is not a valid Postman collection. Please upload a valid Postman collection file.");
          //   return;
          // }

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

  const handleFilterByDate=(id,value)=>{
    if(id==='startDate'){
      setStartDate(value);
      const startDate=value;
      const filteredData = savedRequests.filter(item =>{
        const createdDate = new Date(item.createdDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        return (
          (!start || createdDate > start) &&
          (!end || createdDate < end)
        );
      });
      setFilteredRequests(filteredData);
    }
    else if(id==="endDate"){
      setEndDate(value);
      const endDate=value;
      const filteredData = savedRequests.filter(item =>{
        const createdDate = new Date(item.createdDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        return (
          (!start || createdDate > start) &&
          (!end || createdDate < end)
        );
      });
      setFilteredRequests(filteredData);
    }
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
  };

  // Sorting logic
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    const sortedData = [...savedRequests].sort((a, b) => {
      if(key==="createdDate"){
        // Handle date sorting
        const dateA = new Date(a[key]);
        const dateB = new Date(b[key]);
        return direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      else{
        if (a[key].toLowerCase() < b[key].toLowerCase()) return direction === 'ascending' ? -1 : 1;
        if (a[key].toLowerCase() > b[key].toLowerCase()) return direction === 'ascending' ? 1 : -1;
        return 0;
      }
    });

    setFilteredRequests(sortedData);
    setSortConfig({ key, direction });
  };

  return (
    <div className="p-5 bg-white border rounded-lg shadow-lg mx-auto max-w-screen-lg">
      <h1 className="text-3xl font-bold text-center mb-8 bg-blue-500 text-white p-4 rounded-lg">
        Scriptless API Automation Tool
      </h1>

      {/* Top Controls */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex gap-4 items-center flex-wrap">
          <select
            className="border rounded-lg bg-gray-100 h-40"
            onChange={handleProjectFilterChange}
          >
            <option>Select Project</option>
            {[...new Set(savedRequests.map(request => request.projectName))].map((project, index) => (
              <option key={index} value={project}>{project}</option>
            ))}
          </select>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" className="p-3 border rounded-lg bg-gray-100" onChange={(event)=>handleFilterByDate("startDate",event.target.value)} />
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" className="p-3 border rounded-lg bg-gray-100" onChange={(event)=>handleFilterByDate("endDate",event.target.value)} />
        </div>
        <input
          type="text"
          placeholder="Search API Collections..."
          className="p-3 border rounded-lg bg-gray-100 w-full sm:w-1/3"
          onChange={handleSearchChange}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4 mb-4">
        <button
          className="bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 transition"
          onClick={() => setShowProjectPopup(true)}
        >
          Create New API Project
        </button>
        <button className="bg-blue-500 text-white px-5 py-3 rounded-lg hover:bg-blue-600 transition">
          Create API JSON File with Multiple Requests
        </button>
      </div>

      {/* Project Table */}
      <table className="w-full border-collapse border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 border cursor-pointer">S.No</th>
            <th className="p-3 border cursor-pointer" onClick={() => handleSort('projectName')}>Project Name {getSortIcon('projectName')}</th>
            <th className="p-3 border cursor-pointer" onClick={() => handleSort('apiCollectionName')}>API Collection Name {getSortIcon('apiCollectionName')}</th>
            <th className="p-3 border cursor-pointer" onClick={() => handleSort('createdDate')}>Created Date {getSortIcon('createdDate')}</th>
            <th className="p-3 border cursor-pointer" onClick={() => handleSort('executionStatus')}>Execution Status {getSortIcon('executionStatus')}</th>
            <th className="p-3 border cursor-pointer" onClick={() => handleSort('projectName')}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((request, index) => (
            <tr key={index}>
              <td className="p-3 border">{indexOfFirstItem + index + 1}</td>
              <td className="p-3 border">{request.projectName}</td>
              <td className="p-3 border">{request.apiCollectionName}</td>
              <td className="p-3 border">{request.createdDate}</td>
              <td className="p-3 border">{request.executionStatus}</td>
              <td className="p-3 border flex gap-2">
                <button className="text-blue-500 hover:scale-110" onClick={() => handleEditProject(request.projectName, request.apiCollectionName)}>
                  <FaEdit />
                </button>
                <button className="text-green-500 hover:scale-110" onClick={() => handleExecuteProject(request.projectName, request.apiCollectionName)}>
                  <FaPlay />
                </button>
                <button className="text-red-500 hover:scale-110" onClick={() => handleDeleteProject(request.projectName)}>
                  <FaTrashAlt />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        {Array.from({ length: Math.ceil(filteredRequests.length / itemsPerPage) }, (_, i) => (
          <button
            key={i}
            className={`px-4 py-2 rounded-lg border ${
              currentPage === i + 1
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => paginate(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Modal */}
      {showProjectPopup && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New API Project</h2>
            <input
              type="text"
              placeholder="Project Name"
              id="projectName"
              className="p-3 border rounded-lg mb-4 w-full"
            />
            <input
              type="text"
              placeholder="API Collection Name"
              id="apiCollectionName"
              className="p-3 border rounded-lg mb-4 w-full"
            />
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Select Input Data Format</label>
              <select
                id="inputFormat"
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                className="p-3 border rounded-lg w-full"
              >
                <option value="Postman Collection">Postman Collection</option>
                <option value="Swagger">Swagger</option>
                <option value="Json File">Json File</option>
              </select>
            </div>
            <input type="file" id="jsonFileInput" className="p-3 border rounded-lg w-full mb-4" />
            <div className="flex justify-center gap-4">
              <button
                className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600"
                onClick={handleProjectSubmit}
              >
                Submit
              </button>
              <button
                className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500"
                onClick={() => setShowProjectPopup(false)}
              >
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
