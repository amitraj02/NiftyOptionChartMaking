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

const renderDBCalendar = (year, tradingDays) => {
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
    backBtn.innerHTML = "← Back to DB Home";
    backBtn.onclick = () => { window.location.hash = "#DBhomePage"; };
    actionHeader.appendChild(backBtn);

    const legend = document.createElement("div");
    legend.className = "calendar-legend";
    legend.innerHTML = `
        <div class="legend-item"><span class="legend-dot trading-day"></span>Trading Day</div>
        <div class="legend-item"><span class="legend-dot market-holiday"></span>Market Holiday</div>
        <div class="legend-item"><span class="legend-dot weekend"></span>Weekend</div>
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
            dayCell.textContent = day;
            
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
            
            calendarGrid.appendChild(dayCell);
        }

        monthCard.appendChild(calendarGrid);
        monthsContainer.appendChild(monthCard);
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
        } else if (routePath === "#DBcalander") {
            const year = queryParams.year || "2026";
            const header = document.querySelector(".DBcontainer .header h2");
            if (header) {
                header.textContent = `DB Calendar - ${year}`;
            }
            fetchTradingDays(year).then(tradingDays => {
                renderDBCalendar(year, tradingDays);
            });
        }
    } catch (e) {
        document.getElementById("mainbody").innerHTML = `
        <h1>Error 404 :: page not found ${e}</h1>
        `;
    }
};

window.addEventListener("hashchange", handleLocation);
handleLocation();

