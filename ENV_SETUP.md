# Elvison OS Environment Variables

Copy this file content to `.env.local` and fill in the values:

```
# Database (Railway PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/elvison_os?schema=public"

# OpenAI API Key
OPENAI_API_KEY="sk-proj-your-key-here"

# Google Calendar (Optional - Configure when ready)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Default User ID (Single-user mode)
DEFAULT_USER_ID="default-user-001"
```

## Setup Instructions

1. Create a `.env.local` file in the project root
2. Copy the template above
3. Fill in your Railway PostgreSQL connection string
4. Add your OpenAI API key
5. (Optional) Configure Google Calendar OAuth credentials
