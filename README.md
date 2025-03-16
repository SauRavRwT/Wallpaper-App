# Description

# Art-Gallery - A Modern Wallpaper Web Application

## Overview
Art-Gallery is a modern web application built with React.js that provides high-quality wallArt-Gallery using the Pexels API. The application offers:

- 🖼️ High-quality wallpaper collection
- 🔄 Regularly updated content
- 🔍 Easy navigation system
- 👥 User-friendly interface

## Features

- 🔍 Smart Search with Recent Searches.
- 💾 Intelligent Caching System.
- ⚡ Fast Loading with Preloader.
- 📱 Responsive Design.
- 🔄 Infinite Scroll with "Load More".
- 🖼️ Lightbox Image Preview.
- ⬇️ Direct Image Download.
- 🎯 Search Suggestions.
- 💪 Performance Optimizations.

## Recent Changes

- Added smart caching system for images (1-hour cache duration).
- Implemented recent searches feature.
- Added search suggestions.
- Improved error handling.
- Enhanced performance with useMemo and useCallback.
- Added loading states and "No Results" feedback.

## Preview
<img src="./images/sample-2.png" />

## Installation

### Prerequisites
- Node.js
- npm (Node Package Manager)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/SauRavRwT/Wallpaper-App.git
```

2. **Install dependencies**
```bash
cd Wallpaper-App
npm install
```

3. **Configure API Key**
- Get your API key from [Pexels](https://www.pexels.com/api/key/)
- Add your API key in the project:
```javascript
const API_KEY = "YOUR_API_KEY";
```

4. **Run the application**
```bash
npm start
```
The application will open at [http://localhost:3000](http://localhost:3000)

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Creates a production build in the `build` folder

## Contributing

We welcome contributions! If you’d like to help improve this project, feel free to fork the repository and submit a Pull Request.
