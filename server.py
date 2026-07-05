import http.server
import socketserver
import urllib.request
import urllib.error
import sys

PORT = 8000

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
        if self.path.startswith('/api/'):
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

with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
    print(f"===========================================================")
    print(f" Local Web Server with Dhan API Proxy Running")
    print(f" Open your browser to: http://localhost:{PORT}/templets/index.html")
    print(f"===========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()
