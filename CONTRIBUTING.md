# Contributing to FinSync360

First off, thank you for considering contributing to FinSync360! 🎉 It's people like you that make FinSync360 such a great tool.

## 🎃 Hacktoberfest 2025

FinSync360 is participating in Hacktoberfest! We welcome contributions from developers of all skill levels. Look for issues labeled `hacktoberfest` and `good-first-issue` to get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Labels](#issue-labels)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to support@finsync360.com.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node version, etc.)

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications**

### 🎯 Good First Issues

New to the project? Look for issues labeled `good-first-issue`. These are specifically chosen to be approachable for newcomers.

### 📝 Documentation

Documentation improvements are always welcome! This includes:
- README improvements
- Code comments
- API documentation
- Tutorials and guides
- Translation to other languages

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 6.0+ (local or MongoDB Atlas)
- **Python** 3.9+ (for ML service)
- **Git** for version control
- **React Native CLI** (for mobile development)

### Setup Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Tally_sync.git
   cd Tally_sync
   ```

3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL-OWNER/Tally_sync.git
   ```

4. **Run the quick setup script**:
   ```bash
   chmod +x quick-setup.sh
   ./quick-setup.sh
   ```

5. **Configure environment variables**:
   - Edit `backend/.env` with your MongoDB connection and API keys
   - Edit `ml-service/.env` with ML service configuration
   - Edit `mobile/.env` for mobile app development

6. **Start the development servers**:
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific service tests
npm run backend:test
npm run frontend:test
npm run mobile:test

# Run integration tests
npm run test:integration
```

### 4. Commit Your Changes

Follow our commit message guidelines (see below).

### 5. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

Go to GitHub and create a pull request from your fork to the main repository.

## Coding Standards

### JavaScript/Node.js

- Use **ES6+** syntax
- Follow **ESLint** configuration
- Use **async/await** instead of callbacks
- Use **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep functions **small and focused**

Example:
```javascript
/**
 * Fetches user data from the database
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object>} User object
 */
async function getUserById(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Error fetching user:', error);
    throw error;
  }
}
```

### Python (ML Service)

- Follow **PEP 8** style guide
- Use **type hints**
- Add **docstrings** to functions and classes
- Use **meaningful variable names**

Example:
```python
def predict_payment_delay(invoice_data: dict) -> dict:
    """
    Predicts the likelihood of payment delay for an invoice.
    
    Args:
        invoice_data: Dictionary containing invoice details
        
    Returns:
        Dictionary with prediction results and confidence score
    """
    # Implementation
    pass
```

### React/React Native

- Use **functional components** with hooks
- Follow **React best practices**
- Use **PropTypes** or **TypeScript** for type checking
- Keep components **small and reusable**
- Use **meaningful component names**

Example:
```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  // Component logic
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserProfile;
```

### File Organization

- Keep related files together
- Use clear, descriptive file names
- Follow the existing project structure
- Create index files for cleaner imports

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```bash
feat(auth): add JWT token refresh mechanism

Implemented automatic token refresh to improve user experience
and reduce login frequency.

Closes #123
```

```bash
fix(api): resolve payment gateway timeout issue

Added retry logic and increased timeout to 30 seconds
for payment processing.

Fixes #456
```

```bash
docs(readme): update installation instructions

Added Docker setup instructions and improved quick start guide.
```

## Pull Request Process

### Before Submitting

- ✅ Code follows the project's coding standards
- ✅ All tests pass
- ✅ New tests added for new features
- ✅ Documentation updated
- ✅ Commit messages follow guidelines
- ✅ Branch is up to date with main
- ✅ No merge conflicts

### PR Title

Use the same format as commit messages:
```
feat(component): brief description of changes
```

### PR Description

Use the pull request template and include:

1. **Description**: What changes does this PR introduce?
2. **Motivation**: Why is this change needed?
3. **Related Issues**: Link to related issues
4. **Testing**: How was this tested?
5. **Screenshots**: If applicable
6. **Checklist**: Complete the PR checklist

### Review Process

1. At least one maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be credited in the release notes

## Issue Labels

We use labels to organize and prioritize issues:

### Difficulty
- `good-first-issue` - Good for newcomers
- `easy` - Easy to fix
- `medium` - Moderate difficulty
- `hard` - Requires significant effort

### Type
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `question` - Further information requested
- `help-wanted` - Extra attention needed

### Priority
- `priority: high` - Critical issues
- `priority: medium` - Important issues
- `priority: low` - Nice to have

### Status
- `status: in-progress` - Currently being worked on
- `status: needs-review` - Needs review
- `status: blocked` - Blocked by other issues

### Special
- `hacktoberfest` - Hacktoberfest eligible
- `duplicate` - Duplicate issue
- `wontfix` - Won't be fixed

## Areas to Contribute

### Backend (Node.js/Express)
- API endpoint improvements
- Database optimization
- Authentication enhancements
- Error handling improvements
- Test coverage

### Frontend (React/Next.js)
- UI/UX improvements
- Component development
- Performance optimization
- Accessibility improvements
- Responsive design

### Mobile (React Native)
- Feature development
- Bug fixes
- Performance optimization
- Platform-specific improvements

### ML Service (Python/FastAPI)
- Model improvements
- New prediction features
- Performance optimization
- Data processing enhancements

### Documentation
- API documentation
- User guides
- Code examples
- Tutorial videos
- Translation

### DevOps
- CI/CD improvements
- Docker optimization
- Deployment scripts
- Monitoring setup

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **GitHub Issues**: Report bugs and request features
- **Email**: harsh@greenhacker.tech

### Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Credited in the project documentation

## Additional Resources

- [Project README](README.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Architecture Guide](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Questions?

Don't hesitate to ask! Create an issue with the `question` label or reach out to the maintainers.

---

**Thank you for contributing to FinSync360! 🚀**

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in making this project better.
