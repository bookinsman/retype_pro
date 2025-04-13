# Teen Editor - 5th Grade Newsletter Platform

An interactive, manga-styled newsletter platform designed for 5th-grade students. This application allows young editors to review and approve articles by retyping them, with visual feedback and engaging animations.

## Features

- **Manga/Comic Visual Style**: Colorful, engaging interface with comic-style elements
- **Interactive Retyping**: Articles must be retyped to be approved, focusing on engagement rather than accuracy or speed
- **Category-Based Content**: Content organized by subject areas (Science, Math, History, Literature, Art, Technology)
- **Visual Feedback**: Progress bars, animations, and particle effects create an engaging experience
- **Like/Dislike System**: Users can provide feedback on articles
- **Hover Effects & Animations**: Interactive elements respond to user actions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
```
npm install
```
3. Start the development server:
```
npm start
```

## How to Use

1. Select a category from the top navigation bar
2. Click on an article card to open the editor
3. Retype the article text in the input area
4. Once you've reached 90% completion, you can approve the article
5. Use the like/dislike buttons to provide feedback

## Educational Value

This platform helps 5th-grade students:
- Engage with educational content across different subjects
- Practice reading comprehension and typing skills
- Learn about editorial processes in a fun, interactive way
- Explore content relevant to their educational level

## Technologies Used

- React
- TypeScript
- Styled Components
- Framer Motion (for animations)
- TSParticles (for particle effects)

## Project Structure

- `/src/components`: React components
- `/src/context`: Context providers for state management
- `/src/data`: Sample article content
- `/src/styles`: Global styles
- `/src/types`: TypeScript type definitions

## Customization

The platform can be easily customized with:
- New article content in the `articleGenerator.ts` file
- Additional categories by updating the `CATEGORIES` object in `types.ts`
- Different visual themes by modifying the CSS variables in `global.css`
