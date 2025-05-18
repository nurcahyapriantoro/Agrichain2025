# Article Styling Guide

This document provides guidelines for consistent styling across all article files in the Agrichain learning section.

## Required Style Changes for All Articles

Apply these styling classes consistently to all article files:

### Headings

1. **h2 elements** - Main section headings
   ```jsx
   <h2 className="mb-6 font-bold text-3xl">Section Title</h2>
   ```

2. **h3 elements** - Subsection headings
   ```jsx
   <h3 className="font-bold mb-4">Subsection Title</h3>
   ```

3. **Special card h3 elements** - Headings inside colored cards/boxes
   ```jsx
   <h3 className="text-blue-800 text-xl mb-4 font-bold">Card Title</h3>
   ```

### Text Elements

1. **Paragraphs** - All standard paragraphs
   ```jsx
   <p className="mb-4">
     Paragraph content goes here...
   </p>
   ```

2. **Paragraphs after lists** - Add extra top margin
   ```jsx
   <p className="mb-4 mt-6">
     Paragraph that follows a list...
   </p>
   ```

### Lists

1. **Unordered Lists (ul)**
   ```jsx
   <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
     <li>List item one</li>
     <li>List item two</li>
   </ul>
   ```

2. **Ordered Lists (ol)**
   ```jsx
   <ol className="mb-6">
     <li>First item</li>
     <li>Second item</li>
   </ol>
   ```

## Implementation Checklist

These files should have consistent styling applied:

### Blockchain Articles
- [x] articles/blockchain/future-of-blockchain.jsx
- [x] articles/blockchain/smart-contracts.jsx
- [x] articles/blockchain/blockchain-fundamentals.jsx
- [x] articles/blockchain/blockchain-in-agriculture.jsx

### Supply Chain Articles
- [x] articles/supply-chain/what-is-supply-chain.jsx
- [x] articles/supply-chain/traditional-vs-blockchain.jsx
- [x] articles/supply-chain/supply-chain-challenges.jsx
- [x] articles/supply-chain/benefits-of-transparency.jsx

### User Guide Articles
- [x] articles/userguide/getting-started.jsx
- [ ] articles/userguide/user-roles.jsx
- [ ] articles/userguide/product-tracking.jsx
- [ ] articles/userguide/recording-transactions.jsx

## How to Apply Styling Consistently

1. Focus **only** on changing the styling classes, not the content
2. Add classes to existing elements without changing their content
3. Test each file after updating to ensure proper rendering
4. Check for any lint errors introduced and fix them promptly

## Examples of Before/After Changes

### Before:
```jsx
<h2>Introduction</h2>

<p>
  This is a paragraph with no styling classes.
</p>

<ul>
  <li>List item one</li>
  <li>List item two</li>
</ul>
```

### After:
```jsx
<h2 className="mb-6 font-bold text-3xl">Introduction</h2>

<p className="mb-4">
  This is a paragraph with no styling classes.
</p>

<ul className="list-disc list-outside pl-5 space-y-2 mb-6">
  <li>List item one</li>
  <li>List item two</li>
</ul>
``` 