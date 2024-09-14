import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApiTool from './components/apiTool'; // Ensure this is correct
import ApiRequestDetails from './components/ApiRequestDetails';
import ApiExecution from './components/ApiExecution';
import IntroPage from './components/IntroPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/api-tool" element={<ApiTool />} /> {/* This should be added */}
        <Route path="/request-details/:projectName/:apiCollectionName" element={<ApiRequestDetails />} />
        <Route path="/execution/:projectName/:collectionName" element={<ApiExecution />} />
      </Routes>
    </Router>
  );
}

export default App;
