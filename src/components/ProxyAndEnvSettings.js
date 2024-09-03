import React, { useState, useEffect } from 'react';
import '../styles/ProxyAndEnvSettings.css';

function ProxyAndEnvSettings({ onClose, initialSettings, settingsType }) {
  const [proxySettings, setProxySettings] = useState(initialSettings.proxy || {});
  const [envVariables, setEnvVariables] = useState(initialSettings.envVariables || []);

  useEffect(() => {
    if (settingsType === 'env') {
      setProxySettings({});
    } else if (settingsType === 'proxy') {
      setEnvVariables([]);
    }
  }, [settingsType]);

  const handleProxyChange = (e) => {
    const { name, value } = e.target;
    setProxySettings((prevSettings) => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleEnvVariableChange = (index, field, value) => {
    const updatedEnvVariables = [...envVariables];
    updatedEnvVariables[index][field] = value;
    setEnvVariables(updatedEnvVariables);
  };

  const addEnvVariable = () => {
    setEnvVariables([...envVariables, { key: '', value: '' }]);
  };

  const removeEnvVariable = (index) => {
    const updatedEnvVariables = envVariables.filter((_, i) => i !== index);
    setEnvVariables(updatedEnvVariables);
  };

  const handleSave = () => {
    onClose({ proxy: proxySettings, envVariables });
  };

  const handleCancel = () => {
    onClose(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {settingsType === 'proxy' && (
          <>
            <h2>Configure Proxy</h2>
            <div className="form-group">
              <label>Proxy URL</label>
              <input
                type="text"
                name="proxyUrl"
                value={proxySettings.proxyUrl || ''}
                onChange={handleProxyChange}
              />
            </div>
            <div className="form-group">
              <label>Proxy Port</label>
              <input
                type="text"
                name="proxyPort"
                value={proxySettings.proxyPort || ''}
                onChange={handleProxyChange}
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="proxyUsername"
                value={proxySettings.proxyUsername || ''}
                onChange={handleProxyChange}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="proxyPassword"
                value={proxySettings.proxyPassword || ''}
                onChange={handleProxyChange}
              />
            </div>
          </>
        )}

        {settingsType === 'env' && (
          <>
            <h2>Setup Global Variables</h2>
            {envVariables.map((variable, index) => (
              <div key={index} className="env-variable-row">
                <input
                  type="text"
                  placeholder="Key"
                  value={variable.key}
                  onChange={(e) => handleEnvVariableChange(index, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => handleEnvVariableChange(index, 'value', e.target.value)}
                />
                <button onClick={() => removeEnvVariable(index)}>Remove</button>
              </div>
            ))}
            <button className="add-env-variable-btn" onClick={addEnvVariable}>
              + Add Variable
            </button>
          </>
        )}

        <div className="modal-buttons">
          <button onClick={handleSave} className="save-btn">Save</button>
          <button onClick={handleCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default ProxyAndEnvSettings;
