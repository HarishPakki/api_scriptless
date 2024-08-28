import React, { useState } from 'react';
import '../styles/TestDataPopup.css';

function TestDataPopup({ request, onClose, onSave }) {
  const [editedData, setEditedData] = useState({
    headers: request.headers || {},
    body: typeof request.body === 'string' ? parseBody(request.body) : request.body || {},
    queryParams: request.url ? extractQueryParams(request.url) : {},
  });

  // Extract query parameters from the URL
  function extractQueryParams(url) {
    try {
      const urlObj = new URL(url);
      const params = {};
      for (const [key, value] of urlObj.searchParams.entries()) {
        params[key] = value;
      }
      return params;
    } catch (error) {
      console.error('Failed to extract query parameters:', error);
      return {};
    }
  }

  // Parse the body if it's in JSON format
  function parseBody(body) {
    try {
      return JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse body:', error);
      return {};
    }
  }

  const handleInputChange = (e, section, key) => {
    setEditedData({
      ...editedData,
      [section]: {
        ...editedData[section],
        [key]: e.target.value,
      },
    });
  };

  const handleSave = () => {
    onSave({
      ...request,
      headers: editedData.headers,
      body: JSON.stringify(editedData.body),
      url: updateUrlWithParams(request.url, editedData.queryParams),
    });
  };

  const updateUrlWithParams = (url, queryParams) => {
    const urlObj = new URL(url);
    Object.keys(queryParams).forEach((key) => {
      urlObj.searchParams.set(key, queryParams[key]);
    });
    return urlObj.toString();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Test Data for {`Request_${request.index + 1}`}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <h3>Headers</h3>
          <table>
            <tbody>
              {Object.keys(editedData.headers || {}).map((key) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <input
                      type="text"
                      value={editedData.headers[key]}
                      onChange={(e) => handleInputChange(e, 'headers', key)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Query Parameters</h3>
          <table>
            <tbody>
              {Object.keys(editedData.queryParams || {}).map((key) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <input
                      type="text"
                      value={editedData.queryParams[key]}
                      onChange={(e) => handleInputChange(e, 'queryParams', key)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Body</h3>
          <table>
            <tbody>
              {Object.keys(editedData.body || {}).map((key) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <input
                      type="text"
                      value={editedData.body[key]}
                      onChange={(e) => handleInputChange(e, 'body', key)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    </div>
  );
}

export default TestDataPopup;
