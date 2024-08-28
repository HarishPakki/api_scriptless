// utils/testCaseGenerator.js
export function generateTestCasesFromRequests(requests) {
    return requests.map((request, index) => {
      // Example logic to generate test cases
      return {
        'S.No': index + 1,
        Steps: `Send a ${request.method} request to ${request.url}`,
        'Expected Result': `Response status is ${request.expectedStatus || '200 OK'}. ${request.description || 'Check response data.'}`,
      };
    });
  }
  