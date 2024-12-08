import React, { useState } from 'react';
// import '../styles/TestDataPopup.css';

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
            headersArray.forEach((header) => {
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
        } else if (type === 'JSON File') {
            return parseJsonBody(body);
        } else {
            return {};
        }
    }

    // Parse the body from a Postman collection
    function parsePostmanBody(body) {
        if (!body) return '';
        if (typeof body === 'string') {
            try {
                const parsedBody = JSON.parse(body);
                console.log('Parsed Postman body:', parsedBody);
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

    // const renderNestedFields = (obj,section, parentKey = '') => {
    //     return Object.keys(obj).map((key) => {
    //         const value = obj[key];
    //         const inputKey = parentKey ? `${parentKey}.${key}` : key;

    //         if (Array.isArray(value)) {
    //             return (
    //                 <div key={inputKey} className="flex items-center mb-2">
    //                     <label className='flex-1 font-bold'>{key}</label>
    //                     <div className="flex flex-wrap">
    //                         {value.map((item, index) => (
    //                             <input
    //                                 key={`${inputKey}[${index}]`}
    //                                 type="text"
    //                                 value={item}
    //                                 onChange={(e) => handleNestedInputChange(e, section, `${inputKey}[${index}]`)}
    //                                 // className="array-item"
    //                                 className='flex-2 ml-2 min-w-[200px] max-w-full box-border border border-gray-300 p-2 rounded mr-2 mb-2 flex-grow min-w-[150px] max-w-full'
    //                             />
    //                         ))}
    //                     </div>
    //                 </div>
    //             );
    //         }

    //         return typeof value === 'object' && value !== null ? (
    //             <div key={inputKey} className="ml-5 flex items-center mb-2">
    //                 <label>{key}</label>
    //                 <div className="flex flex-wrap ml-5">
    //                     {renderNestedFields(value, inputKey)}
    //                 </div>
    //             </div>
    //         ) : (
    //             <div key={inputKey} className="input-group">
    //                 <label>{key}</label>
    //                 <input
    //                     type="text"
    //                     value={value}
    //                     onChange={(e) => handleNestedInputChange(e, section, inputKey)}
    //                     className="input-field"
    //                 />
    //             </div>
    //         );
    //     });
    // };

    const renderNestedFields = (obj,section, parentKey = '') => {
        return Object.keys(obj).map((key) => {
            const value = obj[key];
            const inputKey = parentKey ? `${parentKey}.${key}` : key;

            if (Array.isArray(value)) {
                return (
                    <tr key={inputKey}>
                        <td className='p-3 border border-gray-300'>
                            <label className='flex-1 font-bold'>{key}</label>
                        </td>
                        <td className='p-3 border border-gray-300'>
                            {value.map((item, index) => (
                                <input
                                    key={`${inputKey}[${index}]`}
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleNestedInputChange(e, section, `${inputKey}[${index}]`)}
                                    // className="array-item"
                                    className='flex-2 ml-2 min-w-[200px] max-w-full box-border border border-gray-300 p-2 rounded mr-2 mb-2 flex-grow min-w-[150px] max-w-full'
                                />
                            ))}
                        </td>
                    </tr>
                );
            }

            return typeof value === 'object' && value !== null ? (
                <tr key={inputKey}>
                    <td className='p-3 border border-gray-300'>
                        <label>{key}</label>
                    </td>
                    <td className='p-3 border border-gray-300'>
                        {renderNestedFields(value, inputKey)}
                    </td>
                </tr>
            ) : (
                <tr key={inputKey}>
                    <td className='p-3 border border-gray-300'>
                        <label>{key}</label>
                    </td>
                    <td className='p-3 border border-gray-300'>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => handleNestedInputChange(e, section, inputKey)}
                            className="input-field"
                        />
                    </td>
                </tr>
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-[1000]" style={{backgroundColor:'rgba(0, 0, 0, 0.4)'}}>
            <div className="bg-white p-8 rounded-xl w-3/4 max-w-3xl overflow-y-auto shadow-lg flex flex-col">
                <div className="flex justify-center items-center mb-5 pb-4 border-b border-gray-300">
                    <h2 className='text-2xl text-gray-600'>Edit Test Data for {`Request_${request.index + 1}`}</h2>
                </div>

                <div className="flex-grow overflow-y-auto h-96 pr-2">
                    <h3>Headers</h3>
                    <table className='w-full border-collapse mb-5'>
                        <tbody>
                            {Object.keys(editedData.headers || {}).map((key) => (
                                <tr key={key}>
                                    <td className='p-3 border border-gray-300'>{key}</td>
                                    <td className='p-3 border border-gray-300'>
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
                    <table className='w-full border-collapse mb-5'>
                        <tbody>
                            {Object.keys(editedData.queryParams || {}).map((key) => (
                                <tr key={key}>
                                    <td className='p-3 border border-gray-300'>{key}</td>
                                    <td className='p-3 border border-gray-300'>
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

                    <h3>Request Body</h3>
                    {/* <div className="flex flex-wrap ml-5">
                        {renderNestedFields(editedData.body, 'body')}
                    </div> */}
                    <table className='w-full border-collapse mb-5'>
                        {renderNestedFields(editedData.body, 'body')}
                    </table>
                </div>
                
                <div className="flex justify-center pt-4 border-t border-gray-300 gap-4">
                    <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-3 text-base rounded-lg cursor-pointer transition duration-300 ease-in-out">Save</button>
                    <button onClick={onClose} className="bg-blue-500 text-white px-6 py-3 text-base rounded-lg cursor-pointer transition duration-300 ease-in-out hover:bg-[#1f639a]">Close</button>
                </div>
            </div>
        </div>
    );
}

export default TestDataPopup;
