# Nifty Chart Analysis

It includes:

the HTML structure
embedded CSS
JavaScript logic
Python server code
a short explanation of how the feature works

This document consolidates the implementation for the Nifty chart analysis page, including the HTML structure, inline CSS, JavaScript logic, and Python local server.

---

## 1. HTML Structure

File: niftyCartAnalysis.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nifty Chart Analysis</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="CSS/style.css">
    <link rel="stylesheet" href="CSS/index.css">
    <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"></script>
    <style>
        body { margin: 0; }
        .page-shell { padding: 1.5rem; }
        .analysis-card {
            background: var(--surface-color);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 1.25rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .panel-row {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: center;
            margin-bottom: 1rem;
        }
        .date-panel {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 0.85rem 1rem;
        }
        .date-panel label {
            color: var(--text-muted);
            font-size: 0.95rem;
        }
        .date-panel select, .date-panel input, .date-panel button {
            padding: 0.6rem 0.8rem;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(255,255,255,0.06);
            color: var(--text-main);
        }
        .date-panel button {
            cursor: pointer;
            background: linear-gradient(135deg, #60a5fa, #8b5cf6);
            border: none;
            font-weight: 600;
        }
        .stat-grid {
            display: grid;
            gap: 0.75rem;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            margin-bottom: 1rem;
        }
        .stat-box {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 0.9rem;
        }
        .stat-box h4 { margin: 0 0 0.4rem; color: var(--accent-blue); }
        .chart-wrap {
            height: 480px;
            min-height: 400px;
            background: #1E222D;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .table-wrap {
            margin-top: 1rem;
            overflow: auto;
            max-height: 320px;
        }
        table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
        th, td { padding: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center; }
        th { color: var(--accent-yellow); }
        .muted { color: var(--text-muted); }
    </style>
</head>
<body>
    <header class="top-header">
        <div class="header-logo"><span>⚡</span> QUANTUM TRADING</div>
        <div class="header-controls">
            <span id="live-time">Loading Time...</span>
            <span style="background: rgba(255,255,255,0.1); padding: 0.4rem 1rem; border-radius: 20px; color: var(--text-main);">Demo Mode</span>
        </div>
    </header>

    <div class="layout-middle">
        <aside class="left-sidebar">
            <div class="sidebar-title">Navigation</div>
            <a href="manue.html" class="nav-item"><span class="nav-icon">🏠</span> Home Dashboard</a>
            <a href="Trade_Setup.html" class="nav-item"><span class="nav-icon">📊</span> Trade Setup</a>
            <a href="niftyCartAnalysis.html" class="nav-item"><span class="nav-icon">📈</span> Nifty Chart Analysis</a>
            <a href="analysis_2026.html" class="nav-item"><span class="nav-icon">💾</span> DataBase</a>
        </aside>

        <main class="main-body">
            <div class="page-shell">
                <div class="analysis-card">
                    <div class="panel-row">
                        <h1 style="margin: 0; font-size: 1.8rem;">Nifty Chart Analysis</h1>
                        <div class="date-panel">
                            <label for="date-select">Select Date</label>
                            <select id="date-select"></select>
                            <button id="load-btn">Show Chart</button>
                        </div>
                    </div>

                    <div class="stat-grid">
                        <div class="stat-box">
                            <h4>Selected Date</h4>
                            <div id="stat-date">--</div>
                        </div>
                        <div class="stat-box">
                            <h4>Range</h4>
                            <div id="stat-range">--</div>
                        </div>
                        <div class="stat-box">
                            <h4>Open</h4>
                            <div id="stat-open">--</div>
                        </div>
                        <div class="stat-box">
                            <h4>Close</h4>
                            <div id="stat-close">--</div>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 0 0 0.75rem;">
                        <h3 style="margin: 0; color: var(--accent-blue);">Nifty Price Chart</h3>
                        <span class="muted">Selected day candles</span>
                    </div>
                    <div id="chart-container" class="chart-wrap">
                        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--text-muted);">Click “Show Chart” to load candlestick data</div>
                    </div>
                    <div id="chart-loading" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-main);">Loading data...</div>

                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Open</th>
                                    <th>High</th>
                                    <th>Low</th>
                                    <th>Close</th>
                                    <th>Volume</th>
                                </tr>
                            </thead>
                            <tbody id="candle-table-body">
                                <tr><td colspan="6" class="muted">Select a date to load data.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <footer class="footer">
        <div style="display: flex; align-items: center;">
            <span class="status-dot"></span> All Systems Operational &nbsp;|&nbsp; Local Environment
        </div>
    </footer>

    <script src="JS/index.js"></script>
    <script src="JS/niftyCartAnalysis.js"></script>
</body>
</html>
```

---

## 2. CSS

The styling for this page is embedded in the HTML head inside the `<style>` block above.

```css
body { margin: 0; }
.page-shell { padding: 1.5rem; }
.analysis-card {
    background: var(--surface-color);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
.panel-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 1rem;
}
.date-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 0.85rem 1rem;
}
.date-panel label {
    color: var(--text-muted);
    font-size: 0.95rem;
}
.date-panel select, .date-panel input, .date-panel button {
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: var(--text-main);
}
.date-panel button {
    cursor: pointer;
    background: linear-gradient(135deg, #60a5fa, #8b5cf6);
    border: none;
    font-weight: 600;
}
.stat-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    margin-bottom: 1rem;
}
.stat-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 0.9rem;
}
.stat-box h4 { margin: 0 0 0.4rem; color: var(--accent-blue); }
.chart-wrap {
    height: 480px;
    min-height: 400px;
    background: #1E222D;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255,255,255,0.1);
}
.table-wrap {
    margin-top: 1rem;
    overflow: auto;
    max-height: 320px;
}
table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
th, td { padding: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center; }
th { color: var(--accent-yellow); }
.muted { color: var(--text-muted); }
```

---

## 3. JavaScript Logic

File: JS/niftyCartAnalysis.js

```javascript
function formatIndianTime(timeValue, dateValue) {
    if (!timeValue) return '--';
    const [year, month, day] = (dateValue || '').split('-').map(Number);
    const [hh = 0, mm = 0, ss = 0] = (timeValue || '00:00:00').split(':').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hh, mm, ss));
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    return new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    }).format(istDate);
}

document.addEventListener('DOMContentLoaded', async () => {
    const dateSelect = document.getElementById('date-select');
    const loadBtn = document.getElementById('load-btn');

    await populateDates();

    loadBtn.addEventListener('click', () => {
        if (dateSelect.value) {
            loadDate(dateSelect.value);
        }
    });

    dateSelect.addEventListener('change', () => {
        if (dateSelect.value) {
            loadDate(dateSelect.value);
        }
    });

});

async function populateDates() {
    const select = document.getElementById('date-select');
    try {
        const response = await fetch('/api/dates');
        const data = await response.json();
        select.innerHTML = '';

        data.forEach(({ date }) => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            select.appendChild(option);
        });

        if (data.length) {
            select.value = data[0].date;
        }
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Unable to load dates</option>';
    }
}

async function loadDate(date) {
    const chartContainer = document.getElementById('chart-container');
    const loading = document.getElementById('chart-loading');
    chartContainer.innerHTML = '<div class="muted" style="padding: 2rem;">Loading candle data...</div>';
    if (loading) loading.style.display = 'block';

    try {
        const response = await fetch(`/api/nifty-holc?date=${encodeURIComponent(date)}`);
        const payload = await response.json();

        const [year, month, day] = (payload.date || '').split('-').map(Number);
        const candles = (payload.candles || []).map((item) => {
            const [hh = 0, mm = 0, ss = 0] = (item.time || '00:00:00').split(':').map(Number);
            return {
                time: Math.floor(Date.UTC(year, month - 1, day, hh, mm, ss) / 1000),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
                label: formatIndianTime(item.time, payload.date)
            };
        });

        renderChart(candles, date);
        renderTable(candles);
        updateStats(payload, candles);
    } catch (error) {
        console.error(error);
        chartContainer.innerHTML = '<div class="muted" style="padding: 2rem;">Unable to load chart data.</div>';
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function renderChart(candles, date) {
    const container = document.getElementById('chart-container');
    container.innerHTML = '';

    if (!candles.length) {
        container.innerHTML = '<div class="muted" style="padding: 2rem;">No candle data for this date.</div>';
        return;
    }

    const [year, month, day] = date.split('-').map(Number);
    const visibleFrom = Date.UTC(year, month - 1, day, 0, 0, 0) / 1000;
    const visibleTo = Date.UTC(year, month - 1, day + 1, 0, 0, 0) / 1000;

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth || 1100,
        height: container.clientHeight || 480,
        localization: {
            timeFormatter: (businessDayOrTimestamp) => {
                const date = typeof businessDayOrTimestamp === 'number'
                    ? new Date(businessDayOrTimestamp * 1000)
                    : businessDayOrTimestamp;
                return new Intl.DateTimeFormat('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Kolkata'
                }).format(date);
            }
        },
        layout: {
            background: { type: 'solid', color: '#1E222D' },
            textColor: '#d1d4dc'
        },
        grid: {
            vertLines: { color: 'rgba(43, 43, 67, 0.5)' },
            horzLines: { color: 'rgba(43, 43, 67, 0.5)' }
        },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(43, 43, 67, 0.5)' },
        timeScale: { borderColor: 'rgba(43, 43, 67, 0.5)', timeVisible: true, secondsVisible: false }
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderDownColor: '#ef5350',
        borderUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        wickUpColor: '#26a69a'
    });

    candleSeries.setData(candles);
    chart.timeScale().setVisibleRange({ from: visibleFrom, to: visibleTo });
    chart.resize(container.clientWidth || 1100, container.clientHeight || 480);

    const heading = document.querySelector('h1');
    if (heading) {
        heading.textContent = `Nifty Chart Analysis • ${date}`;
    }
}

function renderTable(candles) {
    const body = document.getElementById('candle-table-body');
    if (!candles.length) {
        body.innerHTML = '<tr><td colspan="6" class="muted">No data available.</td></tr>';
        return;
    }

    const rows = candles.slice(-20).reverse().map((item) => `
        <tr>
            <td>${item.label}</td>
            <td>${item.open.toFixed(2)}</td>
            <td>${item.high.toFixed(2)}</td>
            <td>${item.low.toFixed(2)}</td>
            <td>${item.close.toFixed(2)}</td>
            <td>${item.volume}</td>
        </tr>
    `).join('');

    body.innerHTML = rows;
}

function updateStats(payload, candles) {
    document.getElementById('stat-date').textContent = payload.date || '--';
    if (!candles.length) {
        document.getElementById('stat-range').textContent = '--';
        document.getElementById('stat-open').textContent = '--';
        document.getElementById('stat-close').textContent = '--';
        return;
    }

    const first = candles[0];
    const last = candles[candles.length - 1];
    const range = (Math.max(...candles.map((c) => c.high)) - Math.min(...candles.map((c) => c.low))).toFixed(2);

    document.getElementById('stat-range').textContent = `${range} pts`;
    document.getElementById('stat-open').textContent = first.open.toFixed(2);
    document.getElementById('stat-close').textContent = last.close.toFixed(2);
}
```

---

## 4. Python Server

File: server.py

```python
import json
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'database' / 'LocalDatabase.db'


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/dates':
            self._send_json(self._get_dates())
            return

        if path == '/api/nifty-holc':
            date = parse_qs(parsed.query).get('date', [''])[0]
            self._send_json(self._get_holc(date))
            return

        if path in {'/', '/index.html'}:
            self._serve_file('index.html')
            return

        self._serve_file(path.lstrip('/'))

    def _serve_file(self, relative_path):
        if not relative_path:
            relative_path = 'index.html'
        file_path = ROOT / relative_path
        if not file_path.exists() or file_path.is_dir():
            self.send_response(404)
            self.end_headers()
            return

        content_type = 'text/html; charset=utf-8'
        if relative_path.endswith('.css'):
            content_type = 'text/css; charset=utf-8'
        elif relative_path.endswith('.js'):
            content_type = 'application/javascript; charset=utf-8'
        elif relative_path.endswith('.json'):
            content_type = 'application/json; charset=utf-8'
        elif relative_path.endswith('.png'):
            content_type = 'image/png'

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.end_headers()
        self.wfile.write(file_path.read_bytes())

    def _get_dates(self):
        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute(
                "SELECT DISTINCT date FROM nifty_50_holc WHERE date IS NOT NULL ORDER BY date DESC LIMIT 60"
            ).fetchall()
        return [{'date': row[0]} for row in rows]

    def _get_holc(self, date):
        if not date:
            return {'error': 'Date is required', 'candles': []}

        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute(
                "SELECT time, open, high, low, close, volume FROM nifty_50_holc WHERE date = ? ORDER BY time",
                (date,),
            ).fetchall()

        candles = []
        for time_value, open_price, high_price, low_price, close_price, volume in rows:
            parts = time_value.split(':')
            if len(parts) < 2:
                continue
            hh = int(parts[0])
            mm = int(parts[1])
            ss = int(parts[2]) if len(parts) > 2 else 0
            date_parts = [int(part) for part in date.split('-')]
            if len(date_parts) != 3:
                continue
            year, month, day = date_parts
            timestamp = int(datetime(year, month, day, hh, mm, ss, tzinfo=timezone.utc).timestamp())
            candles.append({
                'time': time_value,
                'timestamp': timestamp,
                'open': float(open_price),
                'high': float(high_price),
                'low': float(low_price),
                'close': float(close_price),
                'volume': int(volume),
            })

        return {'date': date, 'candles': candles}

    def _send_json(self, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', 8000), Handler)
    print('Serving nse_analysis on http://127.0.0.1:8000')
    server.serve_forever()
```

---

## 5. How It Works

- The page loads a list of available dates from the SQLite database using the `/api/dates` endpoint.
- When a date is selected, the browser requests candle data from `/api/nifty-holc`.
- The chart is rendered with Lightweight Charts and the table shows the latest candles.
- Time labels are formatted in Indian Standard Time using AM/PM display.
