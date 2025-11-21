# Just-some-exercise


## Project Structure

```
root/
├── react/
│   └── simple-app/          # React application
├── vue/
│   └── simple-app/          # Vue application
├── package.json             # Root configuration
└── README.md               # Project documentation
```

## Quick Start

### Prerequisites

- Node.js 16+
- npm 7+

### Installation

```bash
# Install dependencies for all projects
npm run install:all

# Or install each project individually
cd react/simple-app && npm install
cd ../../vue/simple-app && npm install
```

### Development

```bash
# Start all projects in development mode
npm run dev

# Start React project only
npm run dev:react

# Start Vue project only  
npm run dev:vue
```

### Build

```bash
# Build all projects
npm run build

# Build React project individually
cd react/simple-app && npm run build

# Build Vue project individually
cd vue/simple-app && npm run build
```

## Project Details

### React Application
- **Location**: `react/simple-app/`
- **Tech Stack**: React 18 + Vite + TypeScript
- **Dev Port**: 3000
- **Start Command**: `npm run dev`

### Vue Application  
- **Location**: `vue/simple-app/`
- **Tech Stack**: Vue 3 + Vite + TypeScript
- **Dev Port**: 3001
- **Start Command**: `npm run dev`

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development servers for all projects |
| `dev:react` | Start React development server |
| `dev:vue` | Start Vue development server |

## Configuration

### Monorepo Management
This project uses **npm workspaces** for package management, supporting:
- Shared dependencies
- Unified script execution
- Cross-project development

### Development Tools
- **Build Tool**: Vite
- **Package Manager**: npm
- **Language**: TypeScript

## Access URLs

After starting development servers:
- React App: http://localhost:5172
- Vue App: http://localhost:5173

## Future Plan
- [x] Electron
- [x] express
- [ ] ~~flutter~~

## License

This project is licensed under the MIT License.
