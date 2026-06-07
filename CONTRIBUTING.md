# Contributing to ScamScouter

Thank you for your interest in contributing to ScamScouter! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and supportive of all contributors.

## Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/YOUR_USERNAME/scamscouter.git
cd scamscouter
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
# Edit .env.local with your Firebase credentials
npm install
npm run dev
```

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## Development Workflow

### Local Development
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run tests (if available)
```

### Code Style
- Use ES6+ syntax
- Follow existing code patterns
- Add comments for complex logic
- Use meaningful variable names
- Lint before committing

### Committing Changes
```bash
git add .
git commit -m "Brief description of changes"
# Examples:
# "Add Romanian translation for new checker"
# "Fix: prevent XSS in scam report submission"
# "Improve: enhance email validation regex"
```

## Pull Request Process

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**:
   - Title: Clear, descriptive
   - Description: What and why
   - Link related issues
   - Add screenshots for UI changes

3. **PR Guidelines**:
   - ✅ Test your changes
   - ✅ Keep PRs focused and manageable
   - ✅ Update documentation if needed
   - ✅ No hardcoded credentials or secrets
   - ✅ Follow security best practices

## Reporting Issues

### Bug Report
Include:
- Clear title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs if applicable
- Browser/OS information

### Feature Request
Include:
- Clear description
- Use case/motivation
- Proposed solution
- Alternative approaches

## Areas for Contribution

- 🛡️ New scam detector pages
- 🌍 Language translations
- 🐛 Bug fixes
- ⚡ Performance improvements
- 📚 Documentation
- 🧪 Tests
- 🎨 UI/UX improvements

## Security

- **Never commit secrets** - use environment variables
- Report security issues privately to hello@scamscouter.com
- Follow security guidelines in SECURITY.md

## Questions?

- Open a GitHub Discussion
- Email: hello@scamscouter.com

Thank you for making ScamScouter safer! 🙏
