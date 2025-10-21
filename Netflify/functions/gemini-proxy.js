// This file acts as a secure proxy to the Gemini API.
// It keeps your API key hidden on the server.

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { userPrompt, systemInstruction, useSearch } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("API key is not configured on the server.");
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userPrompt }] }],
            safetySettings: [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_ONLY_HIGH"
                }
            ]
        };

        if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        if (useSearch) {
            payload.tools = [{ "google_search": {} }];
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Gemini API Error:", errorBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorBody?.error?.message || 'Failed to get response from Gemini API.' })
            };
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";

        return {
            statusCode: 200,
            body: JSON.stringify({ text })
        };

    } catch (error) {
        console.error("Proxy Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### **How to Deploy This Secure Solution**

Now that the code is ready, you need to deploy it to a hosting service that supports serverless functions. **Netlify** is a great free option for this.

1.  **Project Structure:**
    * Make sure your project files are organized like this:
        ```
        - index.html  (Your main portfolio file)
        - netlify/
          - functions/
            - gemini-proxy.js  (The serverless function file)
        - (Your other files like CV.jpg, lab.jpg, etc.)
        
