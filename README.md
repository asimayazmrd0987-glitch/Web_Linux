🐧 WebUbuntu
A Web-Based Ubuntu Linux environment accessible directly from your browser.
https://ubuntu.com
LICENSE
https://github.com/asimayazmrd0987-glitch/Web_Linux
📸  Preview
plain
┌─────────────────────────────────────────────┐
│  🐧 WebUbuntu — Terminal in Your Browser    │
│                                             │
│  abyss@webubuntu:~$ sudo apt update         │
│  Hit:1 http://archive.ubuntu.com/ubuntu...  │
│  Reading package lists... Done              │
│                                             │
│  abyss@webubuntu:~$ neofetch                │
│  OS: Ubuntu 26.04 LTS x86_64                │
│  Kernel: 6.11.0-14-generic                  │
│  Shell: bash 5.2.32                         │
│  Terminal: WebUbuntu Terminal               │
│  CPU: AMD Ryzen 7 5800H                     │
│  GPU: NVIDIA GeForce RTX 3060               │
│  Memory: 3201MiB / 15847MiB                 │
│                                             │
│  abyss@webubuntu:~$ █                       │
└─────────────────────────────────────────────┘
✨ Features
Table
Feature	Description
🌐 Browser-Based	Access full Ubuntu terminal from any modern browser — no installation needed
🐳 Containerized	Runs in isolated Docker containers for security and portability
⚡ Instant Launch	Spin up a fresh Ubuntu environment in under 5 seconds
🔒 Secure	SSH-key authentication, sandboxed sessions, automatic cleanup
📦 Pre-installed Tools	Docker, Kubernetes, Terraform, Ansible, Node.js, Python, and more
🎨 Customizable	macOS-like glass theme, custom fonts, dark/light modes
💾 Persistent Storage	Optional volume mounting for saving work between sessions
🖥️ Multi-User	Session isolation with per-user environments
🚀 Quick Start
Prerequisites
Docker 24.0+
Docker Compose 2.20+
Or Kubernetes cluster for production
Run Locally
bash
# Clone the repository
git clone https://github.com/asimayazmrd0987-glitch/OOP.git
cd OOP

# Start the environment
docker-compose up -d

# Open in browser
open http://localhost:3000
Using Make
bash
make build    # Build Docker image
make run      # Start container
make stop     # Stop container
make logs     # View logs
make shell    # Enter container shell
🏗️ Architecture
plain
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Terminal  │  │   File Mgr  │  │    System Monitor   │  │
│  │   (xterm.js)│  │  (Web-based)│  │   (Real-time stats) │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          └────────────────┴────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Nginx/WS   │  ← WebSocket proxy
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
   │  Terminal   │  │   Auth     │  │   API      │
   │  Service    │  │  Service   │  │  Gateway   │
   │  (Node.js)  │  │ (JWT/SSH)  │  │  (REST)    │
   └──────┬──────┘  └────────────┘  └────────────┘
          │
   ┌──────▼──────────────────────────────────────┐
   │         Docker Container (Ubuntu 26.04)      │
   │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
   │  │  Bash   │  │  DevOps │  │   Ubuntu    │  │
   │  │ Shell   │  │  Tools  │  │    Pro      │  │
   │  └─────────┘  └─────────┘  └─────────────┘  │
   └──────────────────────────────────────────────┘
🛠️ Tech Stack
Table
Layer	Technology
Frontend	React + TypeScript + xterm.js
Backend	Node.js + Express + WebSocket
Container	Docker + Ubuntu 26.04 LTS
Auth	JWT + SSH Key-based
Proxy	Nginx
CI/CD	GitHub Actions
Monitoring	Prometheus + Grafana
📁 Project Structure
plain
webubuntu/
├── 📂 src/
│   ├── 📂 client/           # React frontend
│   │   ├── components/      # Terminal, FileManager, Monitor
│   │   ├── styles/          # macOS glass theme
│   │   └── App.tsx
│   ├── 📂 server/           # Node.js backend
│   │   ├── websocket/       # Terminal session handler
│   │   ├── auth/            # JWT authentication
│   │   └── api/             # REST API routes
│   └── 📂 container/        # Docker container setup
│       ├── Dockerfile       # Ubuntu 26.04 base image
│       ├── init.sh          # Container startup script
│       └── tools/           # DevOps tool installers
├── 📂 .github/
│   └── workflows/
│       ├── build.yml        # Docker image CI
│       └── deploy.yml       # Deployment CI
├── 📂 k8s/                  # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── 📂 docs/                 # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── CONTRIBUTING.md
├── docker-compose.yml       # Local development
├── Makefile                 # Common commands
└── README.md               # This file
🔧 Configuration
Environment Variables
Table
Variable	Default	Description
WEBUBUNTU_PORT	3000	Web server port
WEBUBUNTU_CONTAINER_IMAGE	ubuntu:26.04	Base Docker image
WEBUBUNTU_MAX_SESSIONS	10	Max concurrent sessions per user
WEBUBUNTU_SESSION_TIMEOUT	3600	Session timeout in seconds
WEBUBUNTU_ENABLE_PRO	true	Enable Ubuntu Pro features
WEBUBUNTU_PERSISTENT_STORAGE	false	Enable persistent home directory
Ubuntu Pro Integration
bash
# Enable Ubuntu Pro in container
sudo pro attach YOUR_TOKEN
sudo pro enable livepatch
sudo pro enable usg
🎨 Customization
Themes
Table
Theme	Command
macOS Glass (default)	make theme-macos
Ubuntu Dark	make theme-ubuntu-dark
Ubuntu Light	make theme-ubuntu-light
Custom	Edit src/client/styles/custom.css
Pre-installed DevOps Tools
bash
# All tools come pre-installed in the container
docker --version      # Docker
kubectl version       # Kubernetes
terraform version     # Terraform
ansible --version     # Ansible
git --version         # Git
node --version        # Node.js
python3 --version     # Python
🔒 Security
Container Isolation: Each session runs in a separate Docker container
No Root Access: Users operate as non-root inside containers
SSH Keys: Authentication via GitHub SSH keys
Auto-Cleanup: Containers destroyed after session timeout
Network Policies: Kubernetes network policies restrict inter-pod communication
🧪 Development
bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
🚢 Deployment
Docker Compose (Single Server)
bash
docker-compose -f docker-compose.prod.yml up -d
Kubernetes (Production)
bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods -n webubuntu
kubectl get svc -n webubuntu
Cloud Platforms
Table
Platform	Deploy Button
AWS	Deploy to ECS
Azure	Deploy to ACI
GCP	Deploy to Cloud Run
DigitalOcean	Deploy to App Platform
📊 Monitoring
Access monitoring dashboards:
Table
Dashboard	URL	Credentials
Grafana	http://localhost:3001	admin/admin
Prometheus	http://localhost:9090	—
🤝 Contributing
Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
See CONTRIBUTING.md for detailed guidelines.
📝 License
This project is licensed under the MIT License — see the LICENSE file for details.
🙏 Acknowledgments
Ubuntu for the amazing OS
xterm.js for the terminal emulator
Docker for containerization
Contributors and the open-source community
📬 Contact
Asim Ayaz
📧 asimayazmrd0987@gmail.com
🐙 @asimayazmrd0987-glitch
<p align="center">
  <sub>Built with ❤️ on Ubuntu 26.04 Pro</sub>
</p>
