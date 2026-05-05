# BotForge

BotForge lets you create AI-powered chatbots trained on your own documents and embed them on any website. Upload a PDF, get a chatbot — no ML expertise required.

## What it does

- **Create chatbots** — give your bot a name, personality, and accent color
- **Train on documents** — upload PDFs and the bot learns from them using RAG (Retrieval-Augmented Generation)
- **Embed anywhere** — one script tag drops a chat bubble onto any website
- **Session management** — control how many visitor conversations each bot can have
- **Email alerts** — get notified when a chatbot hits its session limit

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Database | Supabase |
| Vector search | Supabase pgvector |
| LLM | OpenRouter → GPT-4o-mini |
| Embeddings | Cohere `embed-english-v3.0` |
| Email | Nodemailer + Gmail SMTP |

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/ashishgoyat/chatbot-builder.git
cd chatbot-builder
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Enable the **pgvector** extension: Database → Extensions → search "vector" → enable
3. Run the schema below in the SQL editor

<details>
<summary>Database schema (click to expand)</summary>

```sql
-- Enable pgvector extension first
CREATE EXTENSION IF NOT EXISTS vector;

-- Custom enum for document processing status
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'embedding', 'completed', 'failed');

-- Chatbots
CREATE TABLE chatbots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  welcome_message TEXT,
  color          TEXT DEFAULT '#4f46e5',
  created_at     TIMESTAMP DEFAULT NOW(),
  system_prompt  TEXT,
  sessions       INT4 DEFAULT 5
);

-- Documents
CREATE TABLE documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  file_name  TEXT NOT NULL,
  status     document_status,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Document chunks with vector embeddings
CREATE TABLE document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT4,
  content     TEXT NOT NULL,
  embedding   VECTOR,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Visitor sessions
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id      UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  user_identifier TEXT,
  user_agent      TEXT,
  ip_address      INET
);

-- Chat messages
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role       TEXT CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Atomic session claim (prevents race condition when two visitors connect simultaneously)
CREATE OR REPLACE FUNCTION try_claim_session(p_chatbot_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_claimed BOOLEAN := false;
  v_sessions_after INTEGER;
BEGIN
  UPDATE chatbots
  SET sessions = sessions - 1
  WHERE id = p_chatbot_id AND sessions > 0
  RETURNING sessions INTO v_sessions_after;

  v_claimed := v_sessions_after IS NOT NULL;

  RETURN (
    SELECT jsonb_build_object(
      'claimed', v_claimed,
      'name',    name,
      'user_id', user_id
    )
    FROM chatbots
    WHERE id = p_chatbot_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vector similarity search for RAG
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR,
  chatbot_id      UUID,
  match_count     INT DEFAULT 5
)
RETURNS TABLE (
  id         UUID,
  content    TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.chatbot_id = match_document_chunks.chatbot_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

</details>

### 3. Get API keys

| Service | Where to get it |
|---|---|
| Supabase URL + keys | Project Settings → API |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Cohere | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) |
| Gmail app password | Google Account → Security → App Passwords |

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENROUTER_API_KEY=your_openrouter_api_key
COHERE_API_KEY=your_cohere_api_key

GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Embedding a chatbot

After creating a chatbot, go to its dashboard page and copy the embed snippet. It looks like this:

```html
<script
  src="https://your-domain.com/embed.js"
  data-chatbot-id="your-chatbot-id"
  defer
></script>
```

Paste it before `</body>` on any page. A chat bubble will appear automatically.

## Project structure

```
app/
├── api/
│   ├── chat/              # Streaming chat endpoint (RAG + LLM)
│   ├── chatbot/[id]/      # Get chatbot metadata, delete chatbot
│   ├── documents/upload/  # PDF upload, chunking, embedding
│   └── sessions/          # Visitor session management
├── dashboard/             # Chatbot management UI
├── embed/chatbot/         # Embeddable chat UI (iframeable)
└── login/ signup/         # Auth pages
lib/
├── supabase/              # Client, server, and admin Supabase clients
└── rate-limit.ts          # In-memory sliding window rate limiter
public/
└── embed.js               # Embed script (creates iframe + chat bubble)
```

## License

MIT
