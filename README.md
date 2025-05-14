# Fantasy Cricket App

This project is a Fantasy Cricket web app built with Next.js, Tailwind CSS, and Supabase. It features OTP-based authentication, match view and player selection, and leaderboards.

## Technologies Used

- **Next.js** (React framework for SSR and SSG)
- **Tailwind CSS** (Utility-first CSS framework)
- **Supabase** (Backend-as-a-Service: authentication, database)
- **AOS** (Animate On Scroll library for UI animations)

## Getting Started

### Prerequisites
- Node.js (v16 or later recommended)
- npm or yarn

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd fantasy-cricket
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory.
   - Add the following variables (replace with your actual Supabase project values):
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

- **components/**: Contains React components (AuthForm, Matches, Leaderboard, Navbar, etc.)
- **lib/**: Supabase client configuration
- **pages/**: Next.js pages and API routes
- **styles/**: Global CSS (Tailwind CSS) files
- **public/**: Static assets (images, icons, etc.)

## Environment Variables

The app requires the following environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your [Supabase project settings](https://app.supabase.com/).

## Usage

- **Authentication:** Users can sign up and log in using OTP-based authentication (email/password) or Google OAuth.
- **Matches:** View upcoming and past matches, select players, and manage your fantasy team.
- **Leaderboard:** Track your score and see how you rank against other users.
- **Rules:** Read the game rules and scoring system.

## Customization

- **Styling:** The app uses a custom navy color palette defined in `tailwind.config.js`.
- **Backend:** All authentication and data storage is handled via Supabase.

## License

This project is for internal/educational use.