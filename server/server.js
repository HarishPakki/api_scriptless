const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const compromise = require('compromise');  // Add compromise for NLP

const app = express();
app.use(express.json());
app.use(cors());

const savedRequestsDir = path.join(__dirname, 'saved_requests');

// Ensure the directory exists
if (!fs.existsSync(savedRequestsDir)) {
    fs.mkdirSync(savedRequestsDir);
}

// Helper function to format and remove duplicate steps
const processGeneratedSteps = (steps) => {
    const allSteps = steps.split(/[.;\n]+/).map(step => step.trim()).filter(step => step);
    const uniqueSteps = [...new Set(allSteps)];
    return uniqueSteps.join('. ');
};

// Helper function to generate human-readable sentences for headers and body
const generateReadableSentence = (key, value) => {
    return `Set the ${key.replace(/-/g, ' ')} to be ${value}.`;
};

// Function to generate detailed test cases
const generateDetailedTestCases = (request) => {
    const steps = [];

    steps.push(`1. Set up the API endpoint: ${request.url}`);
    
    const headers = request.headers || {};
    const headerSteps = Object.entries(headers).map(([key, value], index) => {
        return generateReadableSentence(key, value);
    }).join('\n');
    
    steps.push(`2. Include the following headers:\n${headerSteps}`);

    if (request.method === 'POST' && request.body) {
        const bodyData = JSON.parse(request.body);
        const bodySteps = Object.entries(bodyData).map(([key, value]) => {
            return generateReadableSentence(key, value);
        }).join('\n');

        steps.push(`3. Set the request body as follows:\n${bodySteps}`);
    }

    steps.push(`4. Send the ${request.method} request`);

    const expectedResult = [
        "1. The API should return a 200 OK status.",
        "2. The response body should match the expected data structure.",
        "3. The response should conform to the expected JSON schema."
    ].join('\n');

    return {
        Steps: steps.join('\n'),
        Expected_Result: expectedResult
    };
};

// Function to generate test case description with up to 3 words from the URL
const generateTestCaseDescription = (request) => {
    const urlParts = request.url.split('/').filter(part => part && !part.includes('http')).slice(-3).join(', ');
    return `Validate the ${request.method} request for ${urlParts}`;
};

// Route to generate test cases using NLP
app.post('/generate-testcases', async (req, res) => {
    const { projectName, apiCollectionName, requests } = req.body;

    try {
        const testCases = [];

        for (const [index, request] of requests.entries()) {
            try {
                const detailedTestCase = generateDetailedTestCases(request);

                testCases.push({
                    S_No: index + 1,
                    Test_Case_Description: generateTestCaseDescription(request),
                    Test_Steps: detailedTestCase.Steps,
                    Expected_Result: detailedTestCase.Expected_Result
                });
            } catch (err) {
                console.error(`Error processing request ${index + 1}:`, err);
                testCases.push({
                    S_No: index + 1,
                    Test_Case_Description: "Error generating test case",
                    Test_Steps: "Error generating steps",
                    Expected_Result: "Error generating expected result."
                });
            }
        }

        res.status(200).json({ testCases });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ message: 'Failed to generate test cases' });
    }
});

// Route to save modified requests to a dynamic JSON file based on project name and collection name
app.post('/save-requests', (req, res) => {
    const { projectName, apiCollectionName, requests } = req.body;

    const dataToSave = {
        projectName,
        apiCollectionName,
        createdDate: new Date().toISOString(),
        requests
    };

    const fileName = `${projectName}_${apiCollectionName}.json`;
    const filePath = path.join(savedRequestsDir, fileName);

    fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), (err) => {
        if (err) {
            console.error('Error saving modified requests:', err);
            return res.status(500).json({ message: 'Failed to save requests' });
        }
        res.status(200).json({ message: 'Requests saved successfully' });
    });
});

// Route to fetch all saved requests from the folder
app.get('/get-requests', (req, res) => {
    fs.readdir(savedRequestsDir, (err, files) => {
        if (err) {
            console.error('Error reading saved requests directory:', err);
            return res.status(500).json({ message: 'Failed to load requests' });
        }

        const jsonFiles = files.filter(file => file.endsWith('.json'));
        const savedRequests = [];

        Promise.all(jsonFiles.map(file => {
            const filePath = path.join(savedRequestsDir, file);
            return new Promise((resolve, reject) => {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) return reject(err);

                    try {
                        const parsedData = JSON.parse(data);
                        resolve(parsedData);
                    } catch (parseError) {
                        console.error('Error parsing JSON:', parseError);
                        resolve(null); // Push null if parsing fails
                    }
                });
            });
        }))
        .then(results => {
            res.status(200).json({ requests: results.filter(Boolean) });
        })
        .catch(error => {
            console.error('Error reading requests:', error);
            res.status(500).json({ message: 'Error reading saved requests' });
        });
    });
});

// Route to fetch a specific request by projectName and apiCollectionName
app.get('/get-collection/:projectName/:apiCollectionName', (req, res) => {
    const { projectName, apiCollectionName } = req.params;
    const fileName = `${projectName}_${apiCollectionName}.json`;
    const filePath = path.join(savedRequestsDir, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading collection file:', err);
            return res.status(500).json({ message: 'Failed to load collection data' });
        }

        try {
            const savedRequests = JSON.parse(data);
            res.status(200).json(savedRequests);
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ message: 'Failed to parse collection data' });
        }
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
