// a code that use client_id, access_token to fetch information from dhan broker.
// use DHANQ API to fetch user information.

/**
 * Fetches user profile information from DhanHQ API.
 * 
 * @param {string} clientId - The Client ID (dhanClientId) of the user.
 * @param {string} accessToken - The JWT Access Token for authentication.
 * @returns {Promise<Object>} - A promise that resolves to the user profile data.
 */
async function fetchDhanUserProfile(clientId, accessToken) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const url = isLocal ? 'http://localhost:8000/api/v2/profile' : 'https://api.dhan.co/v2/profile';
    const headers = {
        'access-token': accessToken,
        'client-id': clientId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Dhan User Profile:', error);
        throw error;
    }
}

// Export the function if using ES modules, otherwise it will be available globally
// export { fetchDhanUserProfile };

/**
 * Fetches user holdings from DhanHQ API.
 * 
 * @param {string} clientId - The Client ID (dhanClientId) of the user.
 * @param {string} accessToken - The JWT Access Token for authentication.
 * @returns {Promise<Object>} - A promise that resolves to the holdings data.
 */
async function fetchDhanHoldings(clientId, accessToken) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const url = isLocal ? 'http://localhost:8000/api/v2/holdings' : 'https://api.dhan.co/v2/holdings';
    const headers = {
        'access-token': accessToken,
        'client-id': clientId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Dhan Holdings:', error);
        throw error;
    }
}

// Export the functions if using ES modules, otherwise they will be available globally
// export { fetchDhanUserProfile, fetchDhanHoldings };

// Function to render the home view logic
window.renderHome = async function () {
    let clientId = null;
    let accessToken = null;

    // 1. Fetch credentials
    try {
        const response = await fetch('../database/env.txt');
        if (!response.ok) {
            throw new Error(`Failed to load env.txt file: ${response.status}`);
        }
        const envText = await response.text();

        const clientIdMatch = envText.match(/client_ID\s*=\s*"([^"]+)"/);
        const accessTokenMatch = envText.match(/access_Token\s*=\s*"([^"]+)"/);

        clientId = clientIdMatch ? clientIdMatch[1] : null;
        accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

        if (document.getElementById('td-client-id')) {
            document.getElementById('td-client-id').innerText = clientId || 'Not found';
            document.getElementById('td-access-token').innerText = accessToken ? accessToken.substring(0, 15) + '...' : 'Not found';
            document.getElementById('td-refresh-token').innerText = 'N/A';
        }
    } catch (error) {
        console.error('Error fetching env.txt:', error);
        if (document.getElementById('td-client-data')) {
            document.getElementById('td-client-data').innerHTML = `<span style="color:red;">Error loading env.txt: ${error.message}. <br>If you opened this file directly (file:///), fetch will not work. You must run a local web server (like Live Server).</span>`;
        }
        return;
    }

    // 2. Fetch Dhan Holdings and Render
    if (clientId && accessToken) {
        try {
            const holdingsResponse = await fetchDhanHoldings(clientId, accessToken);
            
            // 2a. Determine holdings list from different possible JSON structures returned by the Dhan API
            // The API response may vary (an array, an object wrapping the array in .data, or a single holdings object).
            let holdingsList = [];
            if (Array.isArray(holdingsResponse)) {
                // Direct array format: [ { exchange: 'NSE', ... } ]
                holdingsList = holdingsResponse;
            } else if (holdingsResponse && Array.isArray(holdingsResponse.data)) {
                // Wrapped array format: { data: [ { exchange: 'NSE', ... } ] }
                holdingsList = holdingsResponse.data;
            } else if (holdingsResponse && typeof holdingsResponse === 'object') {
                // Single object format (if only one holding exists and is not wrapped in an array)
                if (holdingsResponse.tradingSymbol || holdingsResponse.securityId) {
                    holdingsList = [holdingsResponse];
                }
            }

            // 2b. Always render the raw JSON response in the designated container (for debugging/diagnostic purposes)
            const fetchedJsonDiv = document.getElementById('feched_json_div');
            if (fetchedJsonDiv) {
                fetchedJsonDiv.innerHTML = `<pre style="white-space: pre-wrap; font-size: 0.8rem; margin: 0;">${JSON.stringify(holdingsResponse, null, 2)}</pre>`;
            }

            // 2c. Always render the holdings data in a clean, simplified HTML table inside the JSON table div
            const jsonTableDiv = document.getElementById('json_data_table_div');
            if (jsonTableDiv) {
                const rows = holdingsList.map(stock => `
                    <tr>
                        <td>${stock.tradingSymbol || '-'}</td>
                        <td>${stock.exchange || '-'}</td>
                        <td>${stock.totalQty || 0}</td>
                        <td>${stock.avgCostPrice != null ? `₹${Number(stock.avgCostPrice).toFixed(2)}` : '-'}</td>
                        <td>${stock.lastTradedPrice != null ? `₹${Number(stock.lastTradedPrice).toFixed(2)}` : '-'}</td>
                    </tr>
                `).join('');

                jsonTableDiv.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="background-color: var(--bg-main);">
                                <th style="padding: 6px; text-align: left;">Symbol</th>
                                <th style="padding: 6px; text-align: left;">Exchange</th>
                                <th style="padding: 6px; text-align: right;">Qty</th>
                                <th style="padding: 6px; text-align: right;">Avg Cost</th>
                                <th style="padding: 6px; text-align: right;">LTP</th>
                            </tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="5" style="text-align: center; padding: 10px;">No holdings data available</td></tr>'}</tbody>
                    </table>
                `;
            }

            // 2d. Display main holdings table summary or show error message if no holdings list was parsed
            if (document.getElementById('td-client-data')) {
                if (holdingsList.length === 0) {
                    document.getElementById('td-client-data').innerHTML = `
                        <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                            No holdings found or failed to fetch.
                            <br><br>
                            <div style="text-align: left; background-color: var(--bg-main); padding: 10px; border-radius: 8px;">
                                <strong>API Response:</strong>
                                <pre style="white-space: pre-wrap; margin-top: 5px;">${JSON.stringify(holdingsResponse, null, 2)}</pre>
                            </div>
                        </div>
                    `;
                    return;
                }

                // Build a nice holdings table
                let holdingsHtml = `
                    <div style="margin-top: 20px; overflow-x: auto;">
                        <h3 style="margin-bottom: 12px; color: var(--text-primary);">Current Holdings</h3>
                        <table style="width: 100%; border-collapse: collapse; background-color: var(--bg-card); font-size: 0.9rem;">
                            <thead>
                                <tr style="background-color: var(--bg-main); text-align: left;">
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color);">Symbol</th>
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color);">Exchange</th>
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color); text-align: right;">Qty</th>
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color); text-align: right;">Avg Cost</th>
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color); text-align: right;">LTP</th>
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color); text-align: right;">Current Val</th>
                                    <th style="padding: 10px; border-bottom: 2px solid var(--border-color); text-align: right;">P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                let totalInvested = 0;
                let totalCurrentValue = 0;

                holdingsList.forEach(stock => {
                    const qty = stock.totalQty || 0;
                    const avgPrice = stock.avgCostPrice || 0;
                    const ltp = stock.lastTradedPrice || 0;

                    const invested = qty * avgPrice;
                    const currentVal = qty * ltp;
                    const pnl = currentVal - invested;

                    totalInvested += invested;
                    totalCurrentValue += currentVal;

                    const pnlColor = pnl >= 0 ? 'var(--color-call)' : 'var(--color-put)';
                    const pnlSign = pnl >= 0 ? '+' : '';

                    holdingsHtml += `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 10px; font-weight: 600;">${stock.tradingSymbol}</td>
                            <td style="padding: 10px; color: var(--text-secondary);">${stock.exchange}</td>
                            <td style="padding: 10px; text-align: right;">${qty}</td>
                            <td style="padding: 10px; text-align: right;">₹${avgPrice.toFixed(2)}</td>
                            <td style="padding: 10px; text-align: right; font-weight: 500;">₹${ltp.toFixed(2)}</td>
                            <td style="padding: 10px; text-align: right; font-weight: 500;">₹${currentVal.toFixed(2)}</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold; color: ${pnlColor};">
                                ${pnlSign}₹${pnl.toFixed(2)} (${((pnl / (invested || 1)) * 100).toFixed(2)}%)
                            </td>
                        </tr>
                    `;
                });

                const totalPnl = totalCurrentValue - totalInvested;
                const totalPnlColor = totalPnl >= 0 ? 'var(--color-call)' : 'var(--color-put)';
                const totalPnlSign = totalPnl >= 0 ? '+' : '';

                holdingsHtml += `
                                <tr style="background-color: var(--bg-main); font-weight: bold;">
                                    <td colspan="2" style="padding: 12px; border-top: 2px solid var(--border-color);">Total Summary</td>
                                    <td colspan="3" style="padding: 12px; border-top: 2px solid var(--border-color); text-align: right; color: var(--text-secondary);">
                                        Invested: ₹${totalInvested.toFixed(2)}
                                    </td>
                                    <td style="padding: 12px; border-top: 2px solid var(--border-color); text-align: right;">
                                        ₹${totalCurrentValue.toFixed(2)}
                                    </td>
                                    <td style="padding: 12px; border-top: 2px solid var(--border-color); text-align: right; color: ${totalPnlColor};">
                                        ${totalPnlSign}₹${totalPnl.toFixed(2)} (${((totalPnl / (totalInvested || 1)) * 100).toFixed(2)}%)
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;

                document.getElementById('td-client-data').innerHTML = holdingsHtml;
            }
        } catch (error) {
            console.error('Error fetching Dhan API:', error);
            if (document.getElementById('td-client-data')) {
                document.getElementById('td-client-data').innerHTML = `<span style="color:red;">Error fetching Dhan API: ${error.message}. <br>The API might block browser requests (CORS error). Please check your browser console.</span>`;
            }
        }
    } else {
        if (document.getElementById('td-client-data')) {
            document.getElementById('td-client-data').innerText = 'Could not parse credentials from env.txt';
        }
    }
};
