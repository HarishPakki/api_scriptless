import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/apiTable.css';

function ApiTable() {
  const [savedRequests, setSavedRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/get-requests')
      .then(response => response.json())
      .then(data => {
        setSavedRequests(data.requests || []);
      })
      .catch(error => {
        console.error('Error fetching saved requests:', error);
      });
  }, []);

  const handlePagination = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewResults = (request) => {
    navigate(`/execution/${request.projectName}/${request.apiCollectionName}`, { state: request });
  };

  const paginatedRequests = savedRequests.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="table-container">
      <h3>API Collections</h3>
      <table className="requests-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Project Name</th>
            <th>API Collection Name</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Results</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRequests.length > 0 ? (
            paginatedRequests.map((request, index) => (
              <tr key={index}>
                <td>{index + 1 + (currentPage - 1) * rowsPerPage}</td>
                <td>{request.projectName}</td>
                <td>
                  <button 
                    className="collection-link-btn"
                    onClick={() => handleViewResults(request)}
                  >
                    {request.apiCollectionName}
                  </button>
                </td>
                <td>Status Placeholder</td>
                <td>{new Date(request.createdDate).toLocaleDateString()}</td>
                <td><button className="view-results-link">View Results</button></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="no-data">No data available. Please upload a JSON file.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: Math.ceil(savedRequests.length / rowsPerPage) }, (_, index) => (
          <button key={index} onClick={() => handlePagination(index + 1)} className={currentPage === index + 1 ? 'active' : ''}>
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ApiTable;
