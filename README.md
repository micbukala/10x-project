# AI SciSum

AI SciSum is a web application designed to help scientists, students, and professionals quickly digest key information from scientific articles. Users can paste article text to receive automatically generated, structured summaries, or create and edit notes manually. All summaries are stored securely in user accounts for easy access, significantly reducing the time needed for literature analysis and improving research efficiency.

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Getting Started Locally](#-getting-started-locally)
- [Available Scripts](#-available-scripts)
- [Project Scope](#-project-scope)
- [Project Status](#-project-status)
- [License](#-license)

## 🛠 Tech Stack

### Frontend

- **[Astro 5](https://astro.build/)** - Fast, efficient pages and applications with minimal JavaScript
- **[React 19](https://react.dev/)** - Interactive components where needed
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing and enhanced IDE support
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library

### Backend

- **[Supabase](https://supabase.com/)** - PostgreSQL database, Backend-as-a-Service, and built-in authentication

### AI Integration

- **[OpenRouter.ai](https://openrouter.ai/)** - Access to multiple AI models (OpenAI, Anthropic, Google, and more) with flexible pricing and API limits

### DevOps

- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker containers

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js 22.14.0** (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- **npm** or **yarn** package manager
- **Supabase account** for database and authentication
- **OpenRouter.ai API key** for AI summary generation

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/ai-scisum.git
   cd ai-scisum
   ```

2. **Install Node.js version:**

   ```bash
   nvm use
   # or
   nvm install 22.14.0
   nvm use 22.14.0
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up environment variables:**

   Create a `.env` file in the root directory:

   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenRouter.ai Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. **Set up Supabase database:**

   Run the database migrations in your Supabase project (migrations to be added).

6. **Start the development server:**

   ```bash
   npm run dev
   ```

7. **Open your browser:**

   Navigate to `http://localhost:4321`

## 📜 Available Scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the development server with hot reload |
| `npm run build`    | Build the application for production         |
| `npm run preview`  | Preview the production build locally         |
| `npm run astro`    | Run Astro CLI commands                       |
| `npm run lint`     | Run ESLint to check code quality             |
| `npm run lint:fix` | Automatically fix linting issues             |
| `npm run format`   | Format code with Prettier                    |

## 📦 Project Scope

### ✅ MVP Features (Included)

**User Account System:**

- User registration with email and password
- Login and logout functionality
- Password reset via email
- Account deletion with all associated data

**AI-Powered Summaries:**

- Paste scientific article text for AI summary generation
- Structured summary with sections: Research Objective, Methods, Results, Discussion, Open Questions, Conclusions
- Auto-generated editable title
- Monthly limit of 5 AI summaries per user
- Usage counter display (e.g., "3/5")

**Manual Summary Creation:**

- Create empty structured summary templates
- Fill in sections manually

**Summary Management:**

- User dashboard with all saved summaries
- View, edit, and delete summaries
- WYSIWYG editor for content modification
- Browser warning for unsaved changes
- Welcome screen for new users

**Legal Compliance:**

- GDPR-compliant data storage and processing

### ❌ Future Features (Not in MVP)

- DOI-based article import
- PDF file upload and parsing
- Automatic text cleaning and parsing
- Tagging and filtering system
- Summary sharing between users
- Figures, tables, and graphics display
- Native mobile applications (iOS/Android)
- Interactive onboarding tutorial
- Auto-save functionality in editor

## 📊 Project Status

**Current Status:** 🚧 In Development (MVP Phase)

### Success Metrics

We're tracking the following metrics to measure product success:

- **AI Acceptance Rate Target: 75%**  
  Percentage of AI-generated summaries accepted by users (measured by summaries with <15% character edits)

- **AI Adoption Rate Target: 75%**  
  Percentage of all summaries created using AI generation vs. manual creation

## 📄 License

This project does not currently have a license. Please contact the project maintainers for information about usage and distribution.

---

Built with ❤️ for the scientific community

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ └── assets/ # Static assets
├── public/ # Public assets
```

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
