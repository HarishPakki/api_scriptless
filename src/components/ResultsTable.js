import React from 'react';
import '../styles/ResultsTable.css'; // Importing custom CSS for this component

function ResultsTable({ results }) {
  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Request Name</th>
          <th>Status</th>
          <th>Response</th>
          <th>Errors</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result, index) => (
          <tr key={index} className={result.status === 'passed' ? 'passed' : 'failed'}>
            <td>{result.requestName}</td>
            <td>{result.status}</td>
            <td>{JSON.stringify(result.response)}</td>
            <td>{result.errors}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ResultsTable;
