export function parsePostmanCollection(collection) {
    if (!collection || !collection.item) {
      console.error("Invalid Postman collection format.");
      return [];
    }
  
    console.log("Parsing Postman collection:", collection);
  
    return collection.item.map((item, index) => {
      const { request } = item;
      const url = formatUrl(request.url);
      console.log(`Processing Request #${index + 1}: ${request.method} ${url}`);
  
      return {
        id: index + 1,
        name: item.name || `Request_${index + 1}`,
        method: request.method,
        url,
        headers: formatHeaders(request.header),
        queryParams: formatQueryParams(url),
        body: formatBody(request.body),
      };
    });
}

function formatUrl(urlObj) {
    console.log("Formatting URL:", urlObj);
    const protocol = urlObj.protocol || "https";
    const host = Array.isArray(urlObj.host) ? urlObj.host.join(".") : urlObj.host;
    const path = Array.isArray(urlObj.path) ? urlObj.path.join("/") : urlObj.path;
    const query = Array.isArray(urlObj.query) ? "?" + new URLSearchParams(urlObj.query.map(q => [q.key, q.value])) : "";
    
    const formattedUrl = `${protocol}://${host}/${path}${query}`;
    console.log("Formatted URL:", formattedUrl);
    return formattedUrl;
}

function formatHeaders(headersArray) {
    console.log("Formatting Headers:", headersArray);
    const headers = {};
    if (Array.isArray(headersArray)) {
      headersArray.forEach(header => {
        if (header.key) headers[header.key] = header.value || "";
      });
    }
    console.log("Formatted Headers:", headers);
    return headers;
}

function formatQueryParams(url) {
    console.log("Formatting Query Params for URL:", url);
    try {
      const urlObj = new URL(url);
      const params = {};
      for (const [key, value] of urlObj.searchParams.entries()) {
        params[key] = value;
      }
      console.log("Extracted Query Params:", params);
      return params;
    } catch (error) {
      console.error('Failed to extract query parameters:', error);
      return {};
    }
}

function formatBody(bodyObj) {
    console.log("Formatting Body:", bodyObj);
    if (!bodyObj) return "";
  
    let bodyContent = "";
    if (bodyObj.mode === "raw") {
      try {
        bodyContent = JSON.parse(bodyObj.raw);
        console.log("Parsed Body:", bodyContent);
      } catch (error) {
        console.warn("Failed to parse JSON body. Returning raw string.");
        bodyContent = bodyObj.raw;
      }
    }
  
    const formattedBody = typeof bodyContent === "object" ? JSON.stringify(bodyContent, null, 2) : bodyContent;
    console.log("Formatted Body:", formattedBody);
    return formattedBody;
}
