import React from 'react';
import '../styles/FileUpload.css'; // Importing custom CSS for this component

function FileUpload({ onUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="file-upload">
      <input type="file" onChange={handleFileChange} className="file-input" />
    </div>
  );
}

export default FileUpload;
