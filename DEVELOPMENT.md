# Israel Housing Finder - Development Documentation

This document provides an overview of the project setup, deployment process, and development guidelines.

## Project Overview

Israel Housing Finder is a web application designed to help users find apartments and houses in Israel. The application is built with React and hosted on GitHub Pages.

## Repository Structure

```
israel-housing-finder/
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions workflow for automatic deployment
├── public/
│   ├── favicon.ico         # Website favicon
│   ├── index.html          # HTML entry point
│   ├── manifest.json       # Web app manifest
│   └── robots.txt          # Robots configuration
├── src/
│   ├── App.css             # Main application styles
│   ├── App.js              # Main application component
│   ├── index.css           # Global styles
│   └── index.js            # JavaScript entry point
├── .gitignore              # Git ignore configuration
├── package.json            # NPM package configuration
├── package-lock.json       # NPM package lock
└── README.md               # Project readme
```

## Deployment Process

The project is automatically deployed to GitHub Pages using GitHub Actions. The workflow is triggered on pushes to the `main` branch.

### GitHub Actions Workflow

The deployment workflow is defined in `.github/workflows/deploy.yml`:

1. Checkout the repository
2. Set up Node.js environment
3. Install dependencies
4. Build the application
5. Deploy to GitHub Pages

The deployed site is available at: https://tcyberchef.github.io/israel-housing-finder/

## Development Setup

To set up the project for local development:

1. Clone the repository:
   ```bash
   git clone https://github.com/TCyberChef/israel-housing-finder.git
   cd israel-housing-finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. To deploy manually:
   ```bash
   npm run deploy
   ```

## Technology Stack

- **Frontend Framework**: React
- **Styling**: CSS
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Future Development Plans

- Add interactive map showing available properties
- Implement advanced search filters (price, size, rooms, etc.)
- Create detailed property information pages
- Develop mobile-responsive design

## Troubleshooting

If GitHub Actions deployment fails:
1. Check that the workflow file is correctly configured
2. Ensure package.json has the correct homepage URL
3. Verify that the gh-pages package is installed
4. Make sure the repository has the correct permissions set

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.