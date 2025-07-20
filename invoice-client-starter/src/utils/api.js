const API_URL = import.meta.env.VITE_API_BASE_URL;

const fetchData = (url, requestOptions) => {
    const apiUrl = `${API_URL}${url}`;
    console.log("\n 🌐 VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);

    return fetch(apiUrl, requestOptions)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }

            if (requestOptions.method !== "DELETE")
                return response.json();
        })
        .catch((error) => {
            throw error;
        });
};

export const apiGet = (url, params = {}, token = null) => {
    const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value != null)
    );

    const apiUrl = `${url}${new URLSearchParams(filteredParams)}`;
    const headers = token
        ? { Authorization: `Bearer ${token}` } // 🟢 JWT token
        : {};

    const requestOptions = {
        method: "GET",
        headers,
        // credentials: "include", // 🍪 cookies varianta (odkomentuj při přechodu)
    };

    return fetchData(apiUrl, requestOptions);
};

export const apiPost = (url, data, token = null) => {
    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), // 🟢 JWT token
    };

    const requestOptions = {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        // credentials: "include", // 🍪 cookies
    };

    return fetchData(url, requestOptions);
};

export const apiPut = (url, data, token = null) => {
    const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    const requestOptions = {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        // credentials: "include", // 🍪 cookies
    };

    return fetchData(url, requestOptions);
};

export const apiDelete = (url, token = null) => {
    const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

    const requestOptions = {
        method: "DELETE",
        headers,
        // credentials: "include", // 🍪 cookies
    };

    return fetchData(url, requestOptions);
};