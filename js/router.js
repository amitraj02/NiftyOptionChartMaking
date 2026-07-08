window.openDBcalander = (year) => {
    window.location.hash = `#DBcalander?year=${year}`;
};

const routes = {
    404: "404.html",
    "": "home.html",
    "#": "home.html",
    "#home": "home.html",
    "#basicStructure": "basicStructure.html",
    "#codeHelp": "codeHelp.html",
    "#products": "products.html",
    "#DBhomePage": "DBhomePage.html",
    "#DBcalander": "DBcalander.html",
    "#DBcalender": "DBcalander.html",
    "#OptionCharAnalysis": "OptionCharAnalysis.html",
};

const fetchTradingDays = async (year) => {
    try {
        const response = await fetch(`../database/NIFTY_${year}.csv`);
        if (!response.ok) return null;
        const text = await response.text();
        const lines = text.split("\n");
        const tradingDays = new Set();
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(",");
            const dateStr = cols[0].trim();
            if (dateStr) {
                const parts = dateStr.split("-");
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, "0");
                    const monthName = parts[1].toUpperCase();
                    const yr = parts[2];
                    const months = {
                        JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
                        JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12"
                    };
                    const month = months[monthName];
                    if (month) {
                        tradingDays.add(`${yr}-${month}-${day}`);
                    }
                }
            }
        }
        return tradingDays;
    } catch (e) {
        console.error("Error loading CSV:", e);
        return null;
    }
};

const renderDBCalendar = (year, tradingDays, dbInfo) => {
    const container = document.querySelector(".DBcontainer");
    if (!container) return;

    let calendarBody = container.querySelector(".calendar-body");
    if (!calendarBody) {
        calendarBody = document.createElement("div");
        calendarBody.className = "calendar-body";
        container.appendChild(calendarBody);
    }
    calendarBody.innerHTML = "";

    const actionHeader = document.createElement("div");
    actionHeader.className = "calendar-action-header";
    calendarBody.appendChild(actionHeader);

    const backBtn = document.createElement("button");
    backBtn.className = "btn-back";
    backBtn.innerHTML = "&larr; Back to DB Home";
    backBtn.onclick = () => { window.location.hash = "#DBhomePage"; };
    actionHeader.appendChild(backBtn);

    const legend = document.createElement("div");
    legend.className = "calendar-legend";
    legend.innerHTML = `
        <div class="legend-item"><span class="legend-dot trading-day"></span>Trading Day</div>
        <div class="legend-item"><span class="legend-dot market-holiday"></span>Market Holiday</div>
        <div class="legend-item"><span class="legend-dot weekend"></span>Weekend</div>
        <div class="legend-item"><span class="legend-dot dot-option"></span>Options PE/CE Data</div>
        <div class="legend-item"><span class="legend-dot dot-nifty"></span>Nifty 50 Data</div>
    `;
    actionHeader.appendChild(legend);

    const monthsContainer = document.createElement("div");
    monthsContainer.className = "months-grid";
    calendarBody.appendChild(monthsContainer);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const targetYear = parseInt(year) || 2026;
    const optionDatesSet = new Set(dbInfo ? dbInfo.dates : []);
    const niftyDatesSet = new Set(dbInfo ? dbInfo.nifty_dates : []);

    for (let month = 0; month < 12; month++) {
        const monthCard = document.createElement("div");
        monthCard.className = "month-card";

        const monthHeader = document.createElement("div");
        monthHeader.className = "month-header";
        monthHeader.textContent = monthNames[month];
        monthCard.appendChild(monthHeader);

        const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
        const daysOfWeekContainer = document.createElement("div");
        daysOfWeekContainer.className = "days-of-week";
        daysOfWeek.forEach(day => {
            const dayElem = document.createElement("span");
            dayElem.className = "day-name";
            dayElem.textContent = day;
            daysOfWeekContainer.appendChild(dayElem);
        });
        monthCard.appendChild(daysOfWeekContainer);

        const calendarGrid = document.createElement("div");
        calendarGrid.className = "calendar-grid";

        const firstDay = new Date(targetYear, month, 1).getDay();
        const totalDays = new Date(targetYear, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement("span");
            emptyCell.className = "calendar-cell empty";
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dayCell = document.createElement("span");
            dayCell.className = "calendar-cell day";
            
            const dayNumSpan = document.createElement("span");
            dayNumSpan.className = "day-number";
            dayNumSpan.textContent = day;
            dayCell.appendChild(dayNumSpan);
            
            const dateKey = `${targetYear}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
            const dayOfWeek = new Date(targetYear, month, day).getDay();

            if (tradingDays) {
                if (tradingDays.has(dateKey)) {
                    dayCell.classList.add("trading-day");
                } else if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayCell.classList.add("weekend");
                } else {
                    dayCell.classList.add("market-holiday");
                }
            } else {
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    dayCell.classList.add("weekend");
                } else {
                    dayCell.classList.add("trading-day");
                }
            }

            const dotsContainer = document.createElement("span");
            dotsContainer.className = "cell-dots";
            
            if (optionDatesSet.has(dateKey)) {
                const optDot = document.createElement("span");
                optDot.className = "dot dot-option";
                optDot.title = "Options PE/CE data present";
                dotsContainer.appendChild(optDot);
            }
            
            if (niftyDatesSet.has(dateKey)) {
                const nfyDot = document.createElement("span");
                nfyDot.className = "dot dot-nifty";
                nfyDot.title = "Nifty 50 index data present";
                dotsContainer.appendChild(nfyDot);
            }
            
            dayCell.onclick = () => {
                showDayPopup(dateKey);
            };

            dayCell.appendChild(dotsContainer);
            calendarGrid.appendChild(dayCell);
        }

        monthCard.appendChild(calendarGrid);
        monthsContainer.appendChild(monthCard);
    }
};

const fetchDBInfo = async () => {
    try {
        const response = await fetch("../db_info");
        if (!response.ok) throw new Error("Failed to fetch database information");
        const data = await response.json();
        
        const totalEntries = document.getElementById("totalEntries");
        if (totalEntries) totalEntries.textContent = data.total_entries.toLocaleString();

        const totalRecords = document.getElementById("totalRecords");
        if (totalRecords) totalRecords.textContent = data.total_records.toLocaleString();

        const totalOptions = document.getElementById("totalOptionsData");
        if (totalOptions) totalOptions.textContent = data.total_options_data.toLocaleString();

        const dbIndexes = document.getElementById("dbIndexes");
        if (dbIndexes) {
            dbIndexes.textContent = data.indexes.length > 0 ? data.indexes.join(", ") : "None";
        }

        const dbExpiries = document.getElementById("dbExpiries");
        if (dbExpiries) {
            dbExpiries.textContent = data.expiry_dates.length > 0 ? data.expiry_dates.join(", ") : "None";
        }

        const dbTradingDays = document.getElementById("dbTradingDays");
        if (dbTradingDays) {
            if (data.dates.length > 0) {
                dbTradingDays.textContent = `${data.dates.length} days (${data.dates[0]} to ${data.dates[data.dates.length - 1]})`;
            } else {
                dbTradingDays.textContent = "0 days";
            }
        }

        const dbStrikes = document.getElementById("dbStrikes");
        if (dbStrikes) {
            if (data.strikes.length > 0) {
                dbStrikes.textContent = `${data.strikes.length} strikes (Range: ${data.strikes[0]} to ${data.strikes[data.strikes.length - 1]})`;
            } else {
                dbStrikes.textContent = "None";
            }
        }
    } catch (e) {
        console.error("Error fetching DB info:", e);
        const infoSection = document.querySelector(".db-info-section");
        if (infoSection && !document.querySelector(".db-server-warning")) {
            const warningDiv = document.createElement("div");
            warningDiv.className = "db-server-warning";
            warningDiv.style.color = "#ef5350";
            warningDiv.style.padding = "12px";
            warningDiv.style.marginTop = "15px";
            warningDiv.style.border = "1px solid #ef5350";
            warningDiv.style.borderRadius = "4px";
            warningDiv.style.backgroundColor = "rgba(239, 83, 80, 0.1)";
            warningDiv.innerHTML = `
                <strong>Warning:</strong> Cannot connect to Python backend server. 
                Please ensure you run <code style="background: #1e1e1e; padding: 2px 5px; color: #fff;">python server.py</code> inside the terminal and open 
                <a href="http://localhost:8000/templets/index.html#DBhomePage" style="color: #58a6ff; text-decoration: underline;">http://localhost:8000/templets/index.html#DBhomePage</a> instead of using Live Server (port 5500).
            `;
            infoSection.insertBefore(warningDiv, infoSection.firstChild);
        }
    }
};

const handleLocation = async () => {
    let path = window.location.hash;
    if (path.length === 0) { path = "#home"; }

    let routePath = path;
    let queryParams = {};
    if (path.includes("?")) {
        const parts = path.split("?");
        routePath = parts[0];
        const rawParams = parts[1].split("&");
        rawParams.forEach(param => {
            const [key, val] = param.split("=");
            if (key) {
                queryParams[key] = decodeURIComponent(val || "");
            }
        });
    }

    const route = routes[routePath] || routes[404];

    try {
        const response = await fetch(route);

        if (!response.ok) throw new Error("File not found");
        const html = await response.text();
        document.getElementById("mainbody").innerHTML = html;

        if (routePath === "#home" || routePath === "" || routePath === "#") {
            if (typeof renderHome === "function") {
                renderHome();
            }
        } else if (routePath === "#basicStructure") {
            // Render Mermaid diagrams after template injection
            if (typeof mermaid !== "undefined") {
                try { mermaid.run({ querySelector: '.projectWorkFlow .mermaid' }); } catch(e) { console.error("Mermaid error:", e); }
            }
        } else if (routePath === "#DBhomePage") {
            fetchDBInfo();
        } else if (routePath === "#DBcalander" || routePath === "#DBcalender") {
            const year = queryParams.year || "2026";
            const header = document.querySelector(".DBcontainer .header h2");
            if (header) {
                header.textContent = `DB Calendar - ${year}`;
            }
            Promise.all([
                fetchTradingDays(year),
                fetch("../db_info").then(r => {
                    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                    return r.json();
                })
            ]).then(([tradingDays, dbInfo]) => {
                renderDBCalendar(year, tradingDays, dbInfo);
            }).catch(error => {
                console.error("Error loading calendar:", error);
                const container = document.querySelector(".DBcontainer");
                if (container) {
                    const errorDiv = document.createElement("div");
                    errorDiv.style.color = "#ef5350";
                    errorDiv.style.padding = "20px";
                    errorDiv.style.margin = "20px 0";
                    errorDiv.style.border = "1px solid #ef5350";
                    errorDiv.style.borderRadius = "4px";
                    errorDiv.style.backgroundColor = "rgba(239, 83, 80, 0.1)";
                    errorDiv.innerHTML = `
                        <h3>Failed to load database/calendar data</h3>
                        <p>${error.message}</p>
                        <p><strong>Note:</strong> Since this application uses a SQLite database on the backend, you must run the Python backend server:
                        <pre style="background: #1e1e1e; padding: 10px; margin: 10px 0; color: #fff; font-family: monospace;">python server.py</pre>
                        and open the application via the Python server URL: <a href="http://localhost:8000/templets/index.html#DBcalander?year=${year}" style="color: #58a6ff; text-decoration: underline;">http://localhost:8000/templets/index.html#DBcalander?year=${year}</a></p>
                        <p>Using Live Server (port 5500) only serves static files and does not handle database query API endpoints.</p>
                    `;
                    container.appendChild(errorDiv);
                }
            });
        } else if (routePath === "#OptionCharAnalysis") {
            const targetDate = queryParams.date || "";
            const dateSpan = document.getElementById("date");
            const idxSpan = document.getElementById("indexName");
            const rangeSpan = document.getElementById("range_of_data");
            if (dateSpan) dateSpan.textContent = `date: ${targetDate}`;
            if (idxSpan) idxSpan.textContent = `index: `;
            if (rangeSpan) rangeSpan.textContent = `range_of_index data: -`;
            
            const selectedDate = () => {
                const value = dateSpan?.textContent?.replace(/^date:\s*/i, "").trim();
                return value || targetDate;
            };

            fetch(`../analysis_details?date=${encodeURIComponent(selectedDate())}`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    const resolvedDate = selectedDate();
                    const resolvedIndex = data.index_name || "NIFTY";
                    const strikes = Array.isArray(data.strikes) ? data.strikes : [];
                    const dayRange = data.range_of_day;
                    const strikeCount = data.strike_count || strikes.length;
                    const indexChartButton = document.getElementById("showIndexChartBtn");
                    const indexChartLabel = document.getElementById("dateofChart");
                    if (idxSpan) idxSpan.textContent = `index: ${resolvedIndex}`;
                    if (dateSpan) dateSpan.textContent = `date: ${resolvedDate}`;
                    if (indexChartLabel) indexChartLabel.textContent = `${resolvedIndex} • ${resolvedDate}`;
                    if (rangeSpan) {
                        if (dayRange && dayRange.low != null && dayRange.high != null) {
                            rangeSpan.textContent = `range_of_index data: ${dayRange.low} - ${dayRange.high} (Δ ${dayRange.value})`;
                        } else if (strikes.length > 1) {
                            rangeSpan.textContent = `range_of_index data: ${strikes[0]} - ${strikes[strikes.length - 1]}`;
                        } else if (strikes.length === 1) {
                            rangeSpan.textContent = `range_of_index data: ${strikes[0]}`;
                        } else {
                            rangeSpan.textContent = `range_of_index data: -`;
                        }
                    }
                    
                    let firstCallCell = null;
                    let firstPutCell = null;
                    let firstCallStrike = null;
                    let firstPutStrike = null;

                    for (let i = 0; ; i++) {
                        const strikeCell = document.getElementById(`strike-${i}`);
                        const callCell = document.getElementById(`call-${i}`);
                        const putCell = document.getElementById(`put-${i}`);
                        if (!strikeCell && !callCell && !putCell) break;

                        const strike = strikes[i];
                        if (strikeCell && strike) {
                            strikeCell.textContent = strike;
                        }
                        
                        if (callCell && strike) {
                            callCell.textContent = `Call (${strike})`;
                            const isCallPresent = data.presence[strike]?.CE;
                            if (isCallPresent) {
                                callCell.classList.add("present");
                                callCell.onclick = () => {
                                    loadOptionChart(targetDate, strike, "CE", callCell);
                                };
                                if (!firstCallCell) {
                                    firstCallCell = callCell;
                                    firstCallStrike = strike;
                                }
                            } else {
                                callCell.classList.remove("present");
                                callCell.onclick = null;
                            }
                        }
                        
                        if (putCell && strike) {
                            putCell.textContent = `Put (${strike})`;
                            const isPutPresent = data.presence[strike]?.PE;
                            if (isPutPresent) {
                                putCell.classList.add("present");
                                putCell.onclick = () => {
                                    loadOptionChart(targetDate, strike, "PE", putCell);
                                };
                                if (!firstPutCell) {
                                    firstPutCell = putCell;
                                    firstPutStrike = strike;
                                }
                            } else {
                                putCell.classList.remove("present");
                                putCell.onclick = null;
                            }
                        }
                    }
                    
                    if (indexChartButton) {
                        indexChartButton.onclick = () => loadIndexChart(resolvedDate, "showIndexChart");
                    }
                    document.querySelectorAll('input[name="indexChartInterval"]').forEach((radio) => {
                        radio.onchange = () => loadIndexChart(resolvedDate, "showIndexChart");
                    });
                    loadIndexChart(resolvedDate, "showIndexChart");

                    if (firstCallCell) {
                        loadOptionChart(resolvedDate, firstCallStrike, "CE", firstCallCell);
                    }
                    if (firstPutCell) {
                        loadOptionChart(resolvedDate, firstPutStrike, "PE", firstPutCell);
                    }
                })
                .catch(error => {
                    console.error("Error loading analysis details:", error);
                    const container = document.getElementById("mainbody");
                    if (container) {
                        container.innerHTML = `
                            <div style="color: #ef5350; padding: 20px; margin: 20px; border: 1px solid #ef5350; border-radius: 4px; background-color: rgba(239, 83, 80, 0.1);">
                                <h3>Failed to load analysis details</h3>
                                <p>${error.message}</p>
                                <p><strong>Note:</strong> Since this application uses a SQLite database on the backend, you must run the Python backend server:
                                <pre style="background: #1e1e1e; padding: 10px; margin: 10px 0; color: #fff; font-family: monospace;">python server.py</pre>
                                and open the application via the Python server URL: <a href="http://localhost:8000/templets/index.html#OptionCharAnalysis?date=${targetDate}" style="color: #58a6ff; text-decoration: underline;">http://localhost:8000/templets/index.html#OptionCharAnalysis?date=${targetDate}</a></p>
                                <p>Using Live Server (port 5500) only serves static files and does not handle database query API endpoints.</p>
                            </div>
                        `;
                    }
                });
        }
    } catch (e) {
        document.getElementById("mainbody").innerHTML = `
        <h1>Error 404 :: page not found ${e}</h1>
        `;
    }
};

const showDayPopup = async (dateKey) => {
    let overlay = document.getElementById("calendar-popup-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "calendar-popup-overlay";
        overlay.className = "popup-overlay";
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="popup-card">
            <div class="popup-card-header">
                <h3>Details for ${dateKey}</h3>
                <button class="popup-close-btn">&times;</button>
            </div>
            <div class="popup-card-body">
                <div style="text-align: center; padding: 20px; color: var(--text-muted);" id="popup-loading">
                    Loading database details...
                </div>
                <div id="popup-details" style="display: none;">
                    <div class="popup-field">
                        <span class="popup-field-label">Index Name</span>
                        <span class="popup-field-value" id="popup-index-name">-</span>
                    </div>
                    <div class="popup-field">
                        <span class="popup-field-label">Day Range (Nifty)</span>
                        <span class="popup-field-value" id="popup-day-range">-</span>
                    </div>
                    <div class="popup-field">
                        <span class="popup-field-label">Strikes Range (Options)</span>
                        <span class="popup-field-value" id="popup-strike-range">-</span>
                    </div>
                    <div class="popup-field">
                        <span class="popup-field-label">Options Records</span>
                        <span class="popup-field-value" id="popup-has-options">No data</span>
                    </div>
                    <div class="popup-field">
                        <span class="popup-field-label">Nifty 50 Records</span>
                        <span class="popup-field-value" id="popup-has-nifty">No data</span>
                    </div>
                </div>
            </div>
            <div class="popup-actions">
                <button class="btn-popup-cancel">Close</button>
                <button class="btn-popup-action" id="btn-popup-analysis" style="display: none;">Analysis Chart</button>
            </div>
        </div>
    `;

    const closeOverlay = () => {
        overlay.classList.remove("active");
    };
    overlay.querySelector(".popup-close-btn").onclick = closeOverlay;
    overlay.querySelector(".btn-popup-cancel").onclick = closeOverlay;
    overlay.onclick = (e) => {
        if (e.target === overlay) closeOverlay();
    };

    // Show overlay with transition
    setTimeout(() => {
        overlay.classList.add("active");
    }, 10);

    try {
        const response = await fetch(`../day_range?date=${dateKey}`);
        if (!response.ok) throw new Error("Failed to load details");
        const data = await response.json();
        
        const loader = document.getElementById("popup-loading");
        if (loader) loader.style.display = "none";
        
        const detailsContainer = document.getElementById("popup-details");
        if (detailsContainer) detailsContainer.style.display = "block";
        
        const idxName = document.getElementById("popup-index-name");
        if (idxName) idxName.textContent = data.index_name;
        
        const dayRange = document.getElementById("popup-day-range");
        if (dayRange) {
            dayRange.textContent = data.has_nifty_data 
                ? `₹${data.nifty_min.toFixed(2)} - ₹${data.nifty_max.toFixed(2)}` 
                : "N/A";
        }
        
        const hasNfy = document.getElementById("popup-has-nifty");
        if (hasNfy) {
            hasNfy.innerHTML = data.has_nifty_data 
                ? '<span style="color: var(--color-call); font-weight: bold;">✔ Present</span>' 
                : '<span style="color: var(--text-muted);">Not present</span>';
        }
        
        const strikeRange = document.getElementById("popup-strike-range");
        if (strikeRange) {
            strikeRange.textContent = data.has_options_data 
                ? `${data.strike_min.toLocaleString()} - ${data.strike_max.toLocaleString()}` 
                : "N/A";
        }
        
        const hasOpt = document.getElementById("popup-has-options");
        if (hasOpt) {
            hasOpt.innerHTML = data.has_options_data 
                ? '<span style="color: var(--color-call); font-weight: bold;">✔ Present</span>' 
                : '<span style="color: var(--text-muted);">Not present</span>';
        }

        const analysisBtn = document.getElementById("btn-popup-analysis");
        if (analysisBtn) {
            analysisBtn.style.display = "inline-block";
            analysisBtn.onclick = () => {
                closeOverlay();
                window.location.hash = `#OptionCharAnalysis?date=${dateKey}`;
            };
        }
    } catch (err) {
        const loader = document.getElementById("popup-loading");
        if (loader) loader.innerHTML = `<span style="color: red;">Error: ${err.message}</span>`;
    }
};

let lastCallData = [];
let lastPutData = [];

window.chartInstances = window.chartInstances || {};

const resampleCandles = (candles, intervalMinutes) => {
    if (!Array.isArray(candles) || candles.length === 0) return [];
    const minute = Number(intervalMinutes) || 1;
    const buckets = new Map();

    candles.forEach((candle) => {
        const dateObj = new Date(`${candle.date}T${candle.time}Z`);
        if (Number.isNaN(dateObj.getTime())) return;

        const minutes = dateObj.getUTCHours() * 60 + dateObj.getUTCMinutes();
        const bucketIndex = Math.floor(minutes / minute);
        const bucketKey = `${candle.date}:${bucketIndex}`;
        if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, {
                date: candle.date,
                time: candle.time,
                open: Number(candle.open),
                high: Number(candle.high),
                low: Number(candle.low),
                close: Number(candle.close),
                volume: Number(candle.volume || 0)
            });
            return;
        }

        const bucket = buckets.get(bucketKey);
        bucket.high = Math.max(bucket.high, Number(candle.high));
        bucket.low = Math.min(bucket.low, Number(candle.low));
        bucket.close = Number(candle.close);
        bucket.volume += Number(candle.volume || 0);
    });

    return Array.from(buckets.values()).sort((a, b) => {
        const aKey = `${a.date}T${a.time}`;
        const bKey = `${b.date}T${b.time}`;
        return aKey.localeCompare(bKey);
    });
};

const drawChart = (containerId, data, title, isIndex) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (window.chartInstances[containerId]) {
        try { window.chartInstances[containerId].remove(); } catch(e) {}
        delete window.chartInstances[containerId];
    }
    
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;">No chart data for ${title}</div>`;
        return;
    }
    
    const chartData = data
        .filter(d => d.close != null && d.open != null && d.high != null && d.low != null)
        .map(d => {
            const dateObj = new Date(`${d.date}T${d.time}Z`);
            return {
                time: Math.floor(dateObj.getTime() / 1000),
                open: parseFloat(d.open),
                high: parseFloat(d.high),
                low: parseFloat(d.low),
                close: parseFloat(d.close),
                value: parseFloat(d.close)
            };
        })
        .filter(d => !isNaN(d.time) && !isNaN(d.close));
    
    chartData.sort((a, b) => a.time - b.time);

    const uniqueChartData = [];
    for (let i = 0; i < chartData.length; i++) {
        if (i === 0 || chartData[i].time !== chartData[i - 1].time) {
            uniqueChartData.push(chartData[i]);
        }
    }

    if (uniqueChartData.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.9rem;">No valid chart data for ${title}</div>`;
        return;
    }

    const chartInstance = LightweightCharts.createChart(container, {
        width: container.clientWidth || 500,
        height: container.clientHeight || 250,
        layout: {
            background: { type: 'solid', color: '#1E222D' },
            textColor: '#d1d4dc',
        },
        grid: {
            vertLines: { color: 'rgba(43, 43, 67, 0.5)' },
            horzLines: { color: 'rgba(43, 43, 67, 0.5)' },
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: {
            visible: true,
            borderColor: 'rgba(43, 43, 67, 0.5)'
        },
        timeScale: {
            visible: true,
            borderColor: 'rgba(43, 43, 67, 0.5)',
            timeVisible: true,
            secondsVisible: false,
            tickMarkFormatter: (time, tickMarkType, locale) => {
                const date = new Date(time * 1000);
                return new Intl.DateTimeFormat('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: 'Asia/Kolkata'
                }).format(date);
            }
        },
        localization: {
            timeFormatter: (timestamp) => {
                const date = new Date(timestamp * 1000);
                return new Intl.DateTimeFormat('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata'
                }).format(date);
            }
        }
    });
    
    window.chartInstances[containerId] = chartInstance;

    if (isIndex) {
        const candlestickSeries = chartInstance.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.05,
            }
        });
        candlestickSeries.setData(uniqueChartData.map(d => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close
        })));
    } else {
        const color = '#26a69a';
        const areaSeries = chartInstance.addAreaSeries({
            title: title,
            lineColor: color,
            topColor: color, 
            bottomColor: 'rgba(0, 0, 0, 0)', 
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.05,
            }
        });
        areaSeries.setData(uniqueChartData.map(d => ({ time: d.time, value: d.close })));
    }

    chartInstance.timeScale().fitContent();
};

const loadIndexChart = async (date, containerId = "showIndexChart") => {
    try {
        const res = await fetch(`../chart_data?date=${encodeURIComponent(date)}&type=nifty`);
        if (!res.ok) throw new Error();
        const candles = await res.json();
        const intervalInput = document.querySelector('input[name="indexChartInterval"]:checked');
        const intervalMinutes = intervalInput ? intervalInput.value : "1";
        const resampled = resampleCandles(candles, intervalMinutes);
        const info = document.getElementById("dateofChart");
        if (info) info.textContent = `NIFTY • ${date} • ${intervalMinutes}m`;
        drawChart(containerId, resampled, `NIFTY ${date} ${intervalMinutes}m`, true);
    } catch {
        drawChart(containerId, [], `NIFTY ${date}`, true);
    }
};

const loadOptionChart = async (date, strike, option_type, cellElement) => {
    try {
        document.querySelectorAll(".option-chain-cell").forEach(c => c.classList.remove("active-selection"));
        if (cellElement) cellElement.classList.add("active-selection");
        
        const res = await fetch(`../chart_data?date=${encodeURIComponent(date)}&type=option&strike=${encodeURIComponent(strike)}&option_type=${encodeURIComponent(option_type)}`);
        if (!res.ok) throw new Error();
        const candles = await res.json();
        
        if (option_type === "CE") {
            lastCallData = candles;
            const info = document.getElementById("callchartinfo");
            if (info) info.textContent = ` Strike: ${strike} CE`;
            drawChart("callchart", candles, `${strike} CE`, false);
        } else {
            lastPutData = candles;
            const info = document.getElementById("putchartinfo");
            if (info) info.textContent = ` Strike: ${strike} PE`;
            drawChart("putchart", candles, `${strike} PE`, false);
        }
    } catch {
        if (option_type === "CE") {
            lastCallData = [];
            drawChart("callchart", [], `${strike} CE`, false);
        } else {
            lastPutData = [];
            drawChart("putchart", [], `${strike} PE`, false);
        }
    }
};

window.addEventListener("hashchange", handleLocation);
handleLocation();

window.addEventListener('resize', () => {
    Object.keys(window.chartInstances || {}).forEach(containerId => {
        const chart = window.chartInstances[containerId];
        const container = document.getElementById(containerId);
        if (chart && container) {
            chart.resize(container.clientWidth, container.clientHeight || 250);
        }
    });
});

