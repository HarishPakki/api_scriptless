import React, { useState } from 'react';
import '../styles/TestDataPopup.css';

function TestDataPopup({ request, onClose, onSave, requestType }) {
  const [editedData, setEditedData] = useState({
    headers: formatHeaders(request.headers),
    body: parseBodyBasedOnType(request.body, requestType),
    queryParams: request.url ? extractQueryParams(request.url) : {},
  });

  // Format headers for easier manipulation
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

  // Function to parse body based on the request type
  function parseBodyBasedOnType(body, type) {
    if (type === 'Postman Collection') {
      return parsePostmanBody(body);
    } else if (type === 'Json File') {
      return parseJsonBody(body);
    } else {
      return {};
    }
  }

  // Parse the body from a Postman collection
  function parsePostmanBody(body) {
    if (!body) return {};
    if (typeof body === 'string') {
      try {
        const parsedBody = JSON.parse(body);
        console.log("Parsed Postman body:", parsedBody);
        return parsedBody;
      } catch (error) {
        console.warn('Postman body is not valid JSON. Returning raw string.');
        return body;
      }
    }
    return {};
  }

  // Parse the body if it's in JSON format (for JSON requests)
  function parseJsonBody(body) {
    try {
      return JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse JSON body:', error);
      return {};
    }
  }

  // Handle input changes for non-nested fields
  const handleInputChange = (e, section, key) => {
    setEditedData({
      ...editedData,
      [section]: {
        ...editedData[section],
        [key]: e.target.value,
      },
    });
  };

  // Handle input changes for nested fields
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

  const handleSave = () => {
    onSave({
      ...request,
      headers: Object.keys(editedData.headers).map(key => ({ key, value: editedData.headers[key] })),
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
            {renderNestedFields(editedData.body, 'body')}
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

