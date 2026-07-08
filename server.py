import http.server
import socketserver
import urllib.request
import urllib.error
import sys
import json
import os
import sqlite3


def get_db_path():
    return os.path.join(os.path.dirname(__file__), "database", "LocalDatabase.db")


def get_db_info(db_path=None):
    db_path = db_path or get_db_path()
    info = {
        "total_entries": 0,
        "indexes": [],
        "strikes": [],
        "dates": [],
        "nifty_dates": [],
        "expiry_dates": [],
        "total_records": 0,
        "total_options_data": 0
    }
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get count in option_master (total entries / total records)
        cursor.execute("SELECT COUNT(*) FROM option_master")
        count = cursor.fetchone()[0]
        info["total_entries"] = count
        info["total_records"] = count
        
        # Get unique indexes
        cursor.execute("SELECT DISTINCT \"index\" FROM option_master ORDER BY \"index\"")
        info["indexes"] = [r[0] for r in cursor.fetchall() if r[0]]
        
        # Get unique strikes
        cursor.execute("SELECT DISTINCT strike FROM option_master ORDER BY strike")
        info["strikes"] = [r[0] for r in cursor.fetchall() if r[0] is not None]
        
        # Get unique dates
        cursor.execute("SELECT DISTINCT date FROM option_master ORDER BY date")
        info["dates"] = [r[0] for r in cursor.fetchall() if r[0]]

        # Get unique dates in nifty_50_holc
        cursor.execute("SELECT DISTINCT date FROM nifty_50_holc ORDER BY date")
        info["nifty_dates"] = [r[0] for r in cursor.fetchall() if r[0]]
        
        # Get unique expiry dates
        cursor.execute("SELECT DISTINCT expiry_date FROM option_master ORDER BY expiry_date")
        info["expiry_dates"] = [r[0] for r in cursor.fetchall() if r[0]]
        
        # Get count in nifty_50_holc (total options data)
        cursor.execute("SELECT COUNT(*) FROM nifty_50_holc")
        info["total_options_data"] = cursor.fetchone()[0]
        
        conn.close()
    except Exception as e:
        sys.stderr.write(f"Error reading DB: {e}\n")
    return info

PORT = 8000
SERVER_PORTS = [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009, 8010]


def get_analysis_details(target_date, db_path=None):
    db_path = db_path or get_db_path()
    result = {
        "date": target_date,
        "atm_strike": 26000,
        "strikes": [],
        "presence": {},
        "index_name": "NIFTY",
        "range_of_day": None,
        "strikes_of_day": [],
        "strike_count": 0
    }

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT close FROM nifty_50_holc WHERE date = ? ORDER BY time DESC LIMIT 1", (target_date,))
        close_row = cursor.fetchone()

        cursor.execute("SELECT DISTINCT \"index\" FROM option_master WHERE date = ?", (target_date,))
        idx_row = cursor.fetchone()
        if idx_row and idx_row[0]:
            result["index_name"] = idx_row[0]

        atm = 26000
        if close_row and close_row[0] is not None:
            close_price = close_row[0]
            atm = int(round(close_price / 50.0) * 50)
        else:
            cursor.execute("SELECT DISTINCT strike FROM option_master WHERE date = ? ORDER BY strike", (target_date,))
            strikes_db = [r[0] for r in cursor.fetchall() if r[0] is not None]
            if strikes_db:
                atm = strikes_db[len(strikes_db) // 2]

        result["atm_strike"] = atm

        cursor.execute("SELECT MIN(low), MAX(high) FROM nifty_50_holc WHERE date = ?", (target_date,))
        range_row = cursor.fetchone()
        if range_row and range_row[0] is not None and range_row[1] is not None:
            result["range_of_day"] = {
                "low": range_row[0],
                "high": range_row[1],
                "value": round(float(range_row[1] - range_row[0]), 2)
            }

        cursor.execute("SELECT DISTINCT strike FROM option_master WHERE date = ? ORDER BY strike", (target_date,))
        strikes_db = [r[0] for r in cursor.fetchall() if r[0] is not None]
        result["strikes_of_day"] = strikes_db
        result["strike_count"] = len(strikes_db)

        if strikes_db:
            result["strikes"] = [strike for strike in strikes_db if abs(strike - atm) <= 150][:7]
            if not result["strikes"]:
                result["strikes"] = strikes_db[:7]
        else:
            result["strikes"] = [atm - 150, atm - 100, atm - 50, atm, atm + 50, atm + 100, atm + 150]

        for strike in result["strikes"]:
            cursor.execute("SELECT DISTINCT option_type FROM option_master WHERE date = ? AND strike = ?", (target_date, strike))
            types = [r[0] for r in cursor.fetchall() if r[0]]
            result["presence"][str(strike)] = {
                "CE": "CE" in types,
                "PE": "PE" in types
            }

        conn.close()
    except Exception as e:
        sys.stderr.write(f"Error querying analysis details: {e}\n")

    return result


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Print logs to stderr for debugging
        sys.stderr.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format%args))

    def send_cors_headers(self, origin=None):
        # Always allow CORS from local origins for development
        self.send_header('Access-Control-Allow-Origin', origin if origin else '*')
        self.send_header('Access-Control-Allow-Headers', 'access-token, client-id, Content-Type, Accept, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Credentials', 'true')

    def do_OPTIONS(self):
        if self.path.startswith('/api/'):
            self.send_response(200)
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
        else:
            super().do_OPTIONS()

    def handle_proxy(self, target_url, method):
        # Extract headers from incoming request
        headers = {}
        for key, val in self.headers.items():
            if key.lower() in ['access-token', 'client-id', 'content-type', 'accept']:
                headers[key] = val

        # Extract POST body if applicable
        content_length = int(self.headers.get('Content-Length', 0))
        data = self.rfile.read(content_length) if content_length > 0 else None

        req = urllib.request.Request(target_url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as response:
                self.send_response(response.status)
                # Forward headers back to client
                for k, v in response.headers.items():
                    if k.lower() not in ['content-encoding', 'transfer-encoding', 'access-control-allow-origin']:
                        self.send_header(k, v)
                
                # Append CORS headers
                self.send_cors_headers(self.headers.get('Origin'))
                self.end_headers()
                self.wfile.write(response.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            for k, v in e.headers.items():
                if k.lower() not in ['content-encoding', 'transfer-encoding', 'access-control-allow-origin']:
                    self.send_header(k, v)
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(500)
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def do_GET(self):
        if self.path == '/db_info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
            info = get_db_info()
            self.wfile.write(json.dumps(info).encode('utf-8'))
        elif self.path.startswith('/analysis_details'):
            query = ""
            if '?' in self.path:
                query = self.path.split('?', 1)[1]
            params = {}
            for param in query.split('&'):
                if '=' in param:
                    k, v = param.split('=', 1)
                    params[k] = v
            
            target_date = params.get('date', '')
            result = get_analysis_details(target_date)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
        elif self.path.startswith('/chart_data'):
            query = ""
            if '?' in self.path:
                query = self.path.split('?', 1)[1]
            params = {}
            for param in query.split('&'):
                if '=' in param:
                    k, v = param.split('=', 1)
                    params[k] = v
            
            target_date = params.get('date', '')
            chart_type = params.get('type', 'nifty')
            strike = params.get('strike', '')
            option_type = params.get('option_type', '')
            
            db_path = "database/LocalDatabase.db"
            candles = []
            
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                if chart_type == 'nifty':
                    cursor.execute("SELECT date, time, open, high, low, close, volume FROM nifty_50_holc WHERE date = ? ORDER BY time", (target_date,))
                    rows = cursor.fetchall()
                    for r in rows:
                        candles.append({
                            "date": r[0],
                            "time": r[1],
                            "open": r[2],
                            "high": r[3],
                            "low": r[4],
                            "close": r[5],
                            "volume": r[6]
                        })
                else:
                    cursor.execute("SELECT date, time, open, high, low, close, volume, delta, gamma FROM option_master WHERE date = ? AND strike = ? AND option_type = ? ORDER BY time", (target_date, int(strike) if strike else 0, option_type))
                    rows = cursor.fetchall()
                    for r in rows:
                        candles.append({
                            "date": r[0],
                            "time": r[1],
                            "open": r[2],
                            "high": r[3],
                            "low": r[4],
                            "close": r[5],
                            "volume": r[6],
                            "delta": r[7],
                            "gamma": r[8]
                        })
                conn.close()
            except Exception as e:
                sys.stderr.write(f"Error querying chart data: {e}\n")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
            self.wfile.write(json.dumps(candles).encode('utf-8'))
        elif self.path.startswith('/day_range'):
            query = ""
            if '?' in self.path:
                query = self.path.split('?', 1)[1]
            params = {}
            for param in query.split('&'):
                if '=' in param:
                    k, v = param.split('=', 1)
                    params[k] = v
            
            target_date = params.get('date', '')
            db_path = "database/LocalDatabase.db"
            result = {
                "date": target_date,
                "index_name": "N/A",
                "nifty_min": None,
                "nifty_max": None,
                "strike_min": None,
                "strike_max": None,
                "has_options_data": False,
                "has_nifty_data": False
            }
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Query options data range
                cursor.execute("SELECT MIN(strike), MAX(strike) FROM option_master WHERE date = ?", (target_date,))
                opt_row = cursor.fetchone()
                if opt_row and opt_row[0] is not None:
                    result["strike_min"] = opt_row[0]
                    result["strike_max"] = opt_row[1]
                    result["has_options_data"] = True
                    
                    cursor.execute("SELECT DISTINCT \"index\" FROM option_master WHERE date = ?", (target_date,))
                    idx_row = cursor.fetchone()
                    if idx_row and idx_row[0]:
                        result["index_name"] = idx_row[0]
                
                # Query index data range
                cursor.execute("SELECT MIN(low), MAX(high) FROM nifty_50_holc WHERE date = ?", (target_date,))
                nfy_row = cursor.fetchone()
                if nfy_row and nfy_row[0] is not None:
                    result["nifty_min"] = nfy_row[0]
                    result["nifty_max"] = nfy_row[1]
                    result["has_nifty_data"] = True
                    if result["index_name"] == "N/A":
                        result["index_name"] = "NIFTY"
                        
                conn.close()
            except Exception as e:
                sys.stderr.write(f"Error querying day range: {e}\n")
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_cors_headers(self.headers.get('Origin'))
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
        elif self.path.startswith('/api/'):
            dhan_path = self.path[5:]  # Remove '/api/'
            target_url = f"https://api.dhan.co/{dhan_path}"
            self.log_message("Proxying GET request to: %s", target_url)
            self.handle_proxy(target_url, 'GET')
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            dhan_path = self.path[5:]
            target_url = f"https://api.dhan.co/{dhan_path}"
            self.log_message("Proxying POST request to: %s", target_url)
            self.handle_proxy(target_url, 'POST')
        else:
            self.send_response(404)
            self.end_headers()

# Allow port reuse to avoid 'Address already in use' errors
socketserver.TCPServer.allow_reuse_address = True


if __name__ == "__main__":
    httpd = None
    for port in SERVER_PORTS:
        try:
            httpd = socketserver.TCPServer(("", port), ProxyHandler)
            PORT = port
            break
        except OSError as exc:
            if exc.errno != 48:
                raise

    if httpd is None:
        raise RuntimeError("Unable to start server: no available port found")

    print(f"===========================================================")
    print(f" Local Web Server with Dhan API Proxy Running")
    print(f" Open your browser to: http://localhost:{PORT}/templets/index.html")
    print(f"===========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()
