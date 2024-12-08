import React, { useEffect } from 'react';

function ReportAssertions({ executionResults, responseStore, assertionsData }) {
  // Perform assertions and generate results
  const performAssertions = () => {
    const assertionResults = executionResults.map((test) => {
      const expectedTitle = assertionsData.find(assertion => assertion['Jira-Id'] === test.jiraId)?.['title(response1)'];
      const actualTitle = responseStore['response1']?.body?.title || 'N/A';

      const passed = expectedTitle === actualTitle;

      return {
        jiraId: test.jiraId,
        expected: expectedTitle,
        actual: actualTitle,
        status: passed ? 'Passed' : 'Failed'
      };
    });

    return assertionResults;
  };

  const assertions = performAssertions();

  // Open new window with assertions report
  const openReportWindow = () => {
    const newWindow = window.open('', '', 'width=800,height=600');
    const htmlContent = `
      <html>
      <head>
        <title>Assertions Report</title>
        <style>
          /* Your custom CSS for styling */
        </style>
      </head>
      <body>
        <h1>Assertions Report</h1>
        <table border="1">
          <thead>
            <tr>
              <th>Jira ID</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${assertions.map(assertion => `
              <tr>
                <td>${assertion.jiraId}</td>
                <td>${assertion.expected}</td>
                <td>${assertion.actual}</td>
                <td>${assertion.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    newWindow.document.write(htmlContent);
    newWindow.document.close();
  };

  return (
    <div>
      <button onClick={openReportWindow}>Open Assertions Report</button>
    </div>
  );
}

export default ReportAssertions;
