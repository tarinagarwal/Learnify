# Learnify - Interactive Learning Platform

Learnify is a modern, feature-rich learning platform that combines interactive quizzes, comprehensive course management, and advanced PDF tools to create an engaging educational experience.

## 🌟 Features

### 1. Interactive Quiz System

- Generate custom quizzes on any topic
- Adjustable difficulty levels (Easy, Medium, Hard)
- Detailed explanations for each answer
- PDF-based quiz generation
- Quiz history tracking
- Performance analytics

### 2. Course Management

- Create and manage structured courses
- Chapter-based content organization
- Course rating system
- Progress tracking
- Rich text content with Markdown support
- Interactive chapter navigation

### 3. PDF Tools

- PDF Chat: Ask questions about PDF content
- PDF Quiz Generation: Create quizzes from PDF content
- PDF Resource Library
- Thumbnail generation for PDFs
- Interactive PDF viewer

### 4. User Management

- Secure authentication
- User profiles
- Progress tracking
- Rating history
- Resource management

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/learnify.git
cd learnify
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

4. Start the development server:

```bash
npm run dev
```

## 🛠️ Tech Stack

- **Frontend:**

  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - Framer Motion
  - Lucide Icons

- **Backend:**

  - Supabase (Database & Authentication)
  - GROQ AI (Quiz Generation & PDF Chat)

- **Tools & Libraries:**
  - Vite
  - PDF.js
  - React Router
  - React Markdown
  - React Hook Form
  - Zod

## 📚 Project Structure

```
learnify/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configurations
│   ├── services/      # API and service integrations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Helper functions
├── supabase/
│   └── migrations/    # Database migrations
└── public/           # Static assets
```

## 🔑 Key Features Explained

### Quiz System

The quiz system uses GROQ AI to generate contextual questions based on either topics or PDF content. Questions include:

- Multiple choice options
- Correct answer
- Detailed explanations
- Difficulty levels

### Course Management

Courses are structured with:

- Title and description
- Multiple chapters
- Rating system
- Progress tracking
- Interactive content

### PDF Tools

PDF processing includes:

- Text extraction
- Chat functionality
- Quiz generation
- Resource management
- Thumbnail generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [GROQ](https://groq.com/) for AI capabilities
- [Vite](https://vitejs.dev/) for the development environment
