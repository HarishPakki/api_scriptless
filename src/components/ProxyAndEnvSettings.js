import React, { useState, useEffect } from 'react';
// import '../styles/ProxyAndEnvSettings.css';

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
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50" style={{backgroundColor:'rgba(0, 0, 0, 0.5)'}}>
      <div className="bg-white p-6 rounded-lg w-auto min-w-96 max-w-full shadow-lg">
        {settingsType === 'proxy' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Configure Proxy
            </h2>
            <div className="mb-4">
              <label className="block font-bold text-gray-700 mb-2">Proxy URL</label>
              <input
                type="text"
                name="proxyUrl"
                value={proxySettings.proxyUrl || ''}
                onChange={handleProxyChange}
                className="w-96 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold text-gray-700 mb-2">Proxy Port</label>
              <input
                type="text"
                name="proxyPort"
                value={proxySettings.proxyPort || ''}
                onChange={handleProxyChange}
                className="w-96 p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="proxyUsername"
                value={proxySettings.proxyUsername || ''}
                onChange={handleProxyChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="proxyPassword"
                value={proxySettings.proxyPassword || ''}
                onChange={handleProxyChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        )}

        {settingsType === 'env' && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Setup Global Variables
            </h2>
            {envVariables.map((variable, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 mb-4"
              >
                <input
                  type="text"
                  placeholder="Key"
                  value={variable.key}
                  onChange={(e) => handleEnvVariableChange(index, 'key', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => handleEnvVariableChange(index, 'value', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => removeEnvVariable(index)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addEnvVariable}
              className="block mx-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Add Variable
            </button>
          </>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

  );
}

export default ProxyAndEnvSettings;
