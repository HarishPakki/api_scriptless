export const getFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting key "${key}" from localStorage:`, error);
    return null;
  }
};

export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
  }
};

// Use this to load settings for proxy or environment variables from a file
export const loadSettingsFromFile = (projectName, collectionName, fileName) => {
  const key = `${projectName}_${collectionName}_${fileName}`;
  return getFromLocalStorage(key);
};

// Use this to save settings for proxy or environment variables to a file
export const saveSettingsToFile = (projectName, collectionName, fileName, data) => {
  const key = `${projectName}_${collectionName}_${fileName}`;
  saveToLocalStorage(key, data);
};
