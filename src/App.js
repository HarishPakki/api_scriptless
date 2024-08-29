import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApiTool from './components/apiTool';
import ApiRequestDetails from './components/ApiRequestDetails';
import ApiExecution from './components/ApiExecution';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ApiTool />} />
        <Route path="/request-details/:projectName/:apiCollectionName" element={<ApiRequestDetails />} />
        <Route path="/execution/:projectName/:collectionName" element={<ApiExecution />} />
        {/* <Route path="/request-details/:collectionName" element={<ApiExecution />} /> */}

      </Routes>
    </Router>
  );
}

export default App;
