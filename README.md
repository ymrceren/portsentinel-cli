#  PortSentinel CLI

A fast, lightweight, and asynchronous **TCP Port & Network Service Scanner** built with Node.js. Designed for network reconnaissance and security audits, PortSentinel tests socket connections concurrently using non-blocking I/O to map exposed ports, infer running services, and calculate round-trip latency.

---

##  Features

* **Asynchronous Concurrency:** Leverages Node.js Event Loop (`Promise.all` + non-blocking TCP sockets) for rapid multi-port probing without thread-blocking overhead.
* **Service Mapping:** Automatically correlates common open ports with standard networking protocols (HTTP, SSH, MySQL, Redis, RDP, etc.).
* **Configurable Scopes:** Supports predefined well-known ports, custom discrete lists, or specific numeric port ranges.
* **Latency Telemetry:** Measures connection round-trip time (RTT) for responsive services.
* **Clean Terminal UI:** Displays clean formatted tables with status indicators and execution duration.

---

##  How It Works (Network Mechanics)

PortSentinel performs an active TCP connection handshake:
1. It initiates a standard **TCP 3-Way Handshake** (`SYN` packet) against the specified target and port.
2. If the endpoint responds with `SYN-ACK`, the `connect` event fires — the port is classified as **`OPEN`**, response time is calculated, and the socket is immediately terminated (`socket.destroy()`).
3. If an explicit `RST` (reset) packet is received, the connection is classified as **`CLOSED`**.
4. If no packet arrives before the configured timeout period, the socket times out, classifying the port as **`FILTERED/CLOSED`** (typically dropped by a stateful firewall or NAT).

---

##  Installation & Usage

### 1. Clone & Install Dependencies

```bash
git clone [https://github.com/ymrceren/portsentinel-cli.git]https://github.com/ymrceren/portsentinel-cli.git)
cd port-sentinel-cli
npm install