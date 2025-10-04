# Contributing to ShopScout

First off, thank you for considering contributing to ShopScout! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details**: Chrome version, OS, extension version
- **Product URL** where the issue occurred

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case**: Why would this be useful?
- **Proposed solution**: How should it work?
- **Alternatives considered**

### Adding New Retailer Support

To add support for a new shopping site:

1. Add site patterns to `SCRAPER_CONFIGS` in `content.js`
2. Define selectors for: title, price, image, seller, reviews, rating
3. Test thoroughly on multiple product pages
4. Update documentation

Example:
```javascript
newsite: {
  patterns: [/newsite\.com/],
  selectors: {
    title: ['.product-title', 'h1.title'],
    price: ['.price', '[data-price]'],
    // ... more selectors
  }
}
```

### Pull Request Process

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test thoroughly**: Test on multiple retailers
5. **Commit**: Use clear, descriptive commit messages
6. **Push**: `git push origin feature/your-feature-name`
7. **Open a Pull Request**

### Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests liberally

Examples:
```
feat: Add support for Etsy product pages
fix: Resolve price parsing issue on Walmart
docs: Update installation instructions
style: Format code with Prettier
refactor: Simplify trust score calculation
```

## Development Setup

See [README.md](README.md#development) for detailed setup instructions.

Quick start:
```bash
git clone https://github.com/yourusername/shopscout.git
cd shopscout
npm install
npm run build
cd server && npm install && npm start
```

## Style Guide

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing ESLint configuration
- Use functional components with hooks (React)
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises when possible

### CSS/Tailwind

- Use Tailwind utility classes
- Follow existing color scheme
- Maintain responsive design
- Ensure accessibility (color contrast, focus states)

### File Organization

- Components in `src/components/`
- Utilities in `src/utils/`
- Types in `src/types.ts`
- One component per file
- Co-locate tests with components

## Testing

Before submitting a PR:

1. **Test on multiple retailers**: Amazon, Walmart, eBay minimum
2. **Test edge cases**: Missing data, slow loading, errors
3. **Check console**: No errors or warnings
4. **Verify UI**: Responsive, accessible, no layout issues
5. **Test performance**: No significant slowdowns

## Documentation

- Update README.md for new features
- Add JSDoc comments for complex functions
- Update REQUIREMENTS.md if changing core functionality
- Include screenshots for UI changes

## Questions?

Feel free to open an issue with the `question` label or start a discussion in GitHub Discussions.

Thank you for contributing! 🚀
