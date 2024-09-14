import React, { useState, useEffect } from 'react';
import '../styles/TestDataPopup.css';

function TestDataPopup({ request, onClose, onSave, requestType }) {
  const [editedData, setEditedData] = useState({
    headers: formatHeaders(request.headers),
    body: parseBodyBasedOnType(request.body, requestType),
    queryParams: request.url ? extractQueryParams(request.url) : {},
  });

  // Ensure correct format for headers
  function formatHeaders(headersArray) {
    const headers = {};
    if (Array.isArray(headersArray)) {
      headersArray.forEach(header => {
        if (header.key) headers[header.key] = header.value || '';
      });
    }
    return headers;
  }

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

  // Parse the body based on the request type
  function parseBodyBasedOnType(body, type) {
    if (!body) return {}; // Return empty object if body is null
    if (typeof body === 'string') {
      // Attempt to parse string body as JSON
      try {
        return JSON.parse(body);
      } catch (error) {
        console.warn('Failed to parse JSON body:', error);
        return { raw: body }; // Return raw string if parsing fails
      }
    }
    return body; // Return body if it's already an object
  }

  // Handle input changes for non-nested fields (headers, query params)
  const handleInputChange = (e, section, key) => {
    setEditedData({
      ...editedData,
      [section]: {
        ...editedData[section],
        [key]: e.target.value,
      },
    });
  };

  // Handle input changes for nested fields (body)
  const handleNestedInputChange = (e, section, path) => {
    const keys = path.split('.');
    setEditedData((prevData) => {
      const newData = { ...prevData };
      let current = newData[section];

      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          current[key] = e.target.value;
        } else {
          current = current[key];
        }
      });

      return newData;
    });
  };

  // Render nested fields for body, arrays, and objects
  const renderNestedFields = (obj, section, parentKey = '') => {
    return Object.keys(obj).map((key) => {
      const value = obj[key];
      const inputKey = parentKey ? `${parentKey}.${key}` : key;

      if (Array.isArray(value)) {
        return (
          <div key={inputKey} className="input-group">
            <label>{key}</label>
            <div className="array-items-container">
              {value.map((item, index) => (
                <input
                  key={`${inputKey}[${index}]`}
                  type="text"
                  value={item}
                  onChange={(e) => handleNestedInputChange(e, section, `${inputKey}[${index}]`)}
                  className="array-item"
                />
              ))}
            </div>
          </div>
        );
      }

      return typeof value === 'object' && value !== null ? (
        <div key={inputKey} className="nested-field input-group">
          <label>{key}</label>
          <div className="nested-fields-container">
            {renderNestedFields(value, section, inputKey)}
          </div>
        </div>
      ) : (
        <div key={inputKey} className="input-group">
          <label>{key}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleNestedInputChange(e, section, inputKey)}
            className="input-field"
          />
        </div>
      );
    });
  };

  // Handle save operation
  const handleSave = () => {
    onSave({
      ...request,
      headers: Object.keys(editedData.headers).map(key => ({ key, value: editedData.headers[key] })),
      body: JSON.stringify(editedData.body), // Stringify the updated body
      url: updateUrlWithParams(request.url, editedData.queryParams),
    });
  };

  // Update URL with query parameters
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
          <div className="nested-fields">
            {Object.keys(editedData.body).length > 0 ? (
              renderNestedFields(editedData.body, 'body')
            ) : (
              <p>No body data available</p>
            )}
          </div>
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
