# NICOLE - Alphabet Learning App

A calm, autism-friendly alphabet and vocabulary learning application.

## Setup Instructions

### Adding Images

Place images for each word in `/public/nicole/images/` with the following naming convention:
- `apple.jpg`
- `ball.jpg`
- `cat.jpg`
- etc.

Each image should be:
- Clear, real-world photographs (not illustrations)
- High quality (at least 400x400px)
- Square aspect ratio recommended
- Simple, uncluttered backgrounds

### Updating Words Data

Edit `/app/NICOLE/data/words.json` to:
- Add more words per letter
- Update sentences
- Add audio file paths (when ready)

### Features

- **Alphabet Grid**: Large, tappable buttons for A-Z
- **Letter Detail**: Shows letter, word, and image
- **Tracing**: Practice writing letters and words
- **Sentence**: See the word used in a sentence

### Design Principles

- No auto-playing sounds
- No timers or pressure
- Large touch targets
- Calm, neutral colors
- Predictable navigation
- One primary action per screen
