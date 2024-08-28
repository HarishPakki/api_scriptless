const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { pipeline } = require('@huggingface/transformers');  // Using Hugging Face transformers

const app = express();
app.use(express.json());
app.use(cors());

const savedRequestsDir = path.join(__dirname, 'saved_requests');

// Ensure the directory exists
if (!fs.existsSync(savedRequestsDir)) {
    fs.mkdirSync(savedRequestsDir);
}

// Helper function to remove duplicate steps
const processGeneratedSteps = (steps) => {
    const allSteps = steps.split(/[.;\n]+/).map(step => step.trim()).filter(step => step);
    const uniqueSteps = [...new Set(allSteps)];
    return uniqueSteps.join('. ');
};

// Helper function to dynamically create a question for the generator
const generateTestCaseQuestion = (request, projectName, apiCollectionName) => {
    const urlParts = request.url.split('/').slice(3).join(', ');
    const bodyData = request.body ? JSON.parse(request.body) : {};
    const testData = Object.entries(bodyData).map(([key, value]) => `${key}=${value}`).join(', ');

    return `Generate testcase steps for an API ${request.method} request with parameters in URL ${urlParts} and test data as ${testData}. Avoid duplicate steps.`;
};

// Route to generate test cases using Hugging Face transformers
app.post('/generate-testcases', async (req, res) => {
    const { projectName, apiCollectionName, requests } = req.body;

    try {
        const generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M');  // Example transformer model
        const testCases = [];

        for (const [index, request] of requests.entries()) {
            try {
                const question = generateTestCaseQuestion(request, projectName, apiCollectionName);
                const output = await generator(question, { max_new_tokens: 500 });

                if (output && output[0] && output[0].generated_text) {
                    const processedSteps = processGeneratedSteps(output[0].generated_text);

                    testCases.push({
                        S_No: index + 1,
                        Steps: processedSteps,
                        Expected_Result: "Expected status code: 200 and correct response data."
                    });
                } else {
                    throw new Error('Invalid output from transformer');
                }
            } catch (err) {
                console.error(`Error processing request ${index + 1}:`, err);
                testCases.push({
                    S_No: index + 1,
                    Steps: "Error generating steps",
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
