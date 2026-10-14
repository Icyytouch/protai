-- 09-seo-meta.sql — per-page SEO metadata editable from the admin panel.
create table if not exists seo_meta (
  page_path text primary key,
  page_label text not null,
  title text not null,
  description text not null,
  keywords text not null default '',
  noindex boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table seo_meta enable row level security;

-- Service role full access (public pages read via the admin client in generateMetadata).
drop policy if exists "service_role_all" on seo_meta;
create policy "service_role_all" on seo_meta
  for all to service_role using (true) with check (true);

-- Seed with SEO-optimized defaults. Titles ~50-60 chars, descriptions ~150 chars,
-- keyword-first, no wasted words. Edit anytime from /dashboard/admin/seo.
insert into seo_meta (page_path, page_label, title, description, keywords, noindex) values
(
  '/',
  'Homepage',
  'ProtAI: AI Cost Control & Metered Billing for AI Apps',
  'Stop runaway AI spend. ProtAI gives every user a credit balance with quotas, alerts and a kill-switch for OpenAI, Anthropic and any LLM. Live in 3 lines of code.',
  'AI cost control, metered billing AI, AI API cost management, LLM spend tracking, usage based billing AI',
  false
),
(
  '/docs',
  'Documentation',
  'ProtAI Docs: Meter AI Usage in 5 Minutes (JS, Python, cURL)',
  'Integrate ProtAI in 5 minutes. Check credit balances before you spend, report usage after — with copy-paste quickstarts for Next.js, Express and FastAPI.',
  'ProtAI docs, AI metering API, check credit balance API, token usage API',
  false
),
(
  '/blog',
  'Blog',
  'ProtAI Blog: AI Cost Control Guides & LLM Pricing Breakdowns',
  'Practical guides to controlling AI API costs — token pricing breakdowns, quota strategies and metering patterns for OpenAI, Anthropic and more.',
  'AI cost control blog, LLM pricing guide, OpenAI cost optimization',
  false
),
(
  '/about',
  'About',
  'About ProtAI: Credit Metering Built for AI App Builders',
  'ProtAI exists for one reason: AI apps should not go broke on token bills. Learn why we built per-user credit metering with guardrails.',
  'about ProtAI, AI cost control company',
  false
),
(
  '/contact',
  'Contact',
  'Contact ProtAI: Talk to Our Team',
  'Questions about billing, integration help or partnerships? Message the ProtAI team — we reply within one business day.',
  'contact ProtAI, ProtAI support',
  false
),
(
  '/security',
  'Security',
  'ProtAI Security: No-Proxy Architecture & Data Protection',
  'How ProtAI protects your data — no-proxy architecture, hashed API keys, encryption everywhere and responsible disclosure.',
  'ProtAI security, AI metering security',
  false
),
(
  '/terms',
  'Terms of Service',
  'ProtAI Terms of Service',
  'The terms governing your use of ProtAI credit metering — plans, billing, API fair use and liability.',
  '',
  false
),
(
  '/privacy',
  'Privacy Policy',
  'ProtAI Privacy Policy (UK GDPR)',
  'How ProtAI collects, uses and protects your data — and your rights under UK GDPR. We never see your prompts.',
  '',
  false
),
(
  '/refunds',
  'Refund Policy',
  'ProtAI Refund Policy',
  'How refunds work at ProtAI — cancel anytime, keep access until the end of your paid month.',
  '',
  false
),
(
  '/login',
  'Login',
  'Log in to ProtAI',
  'Log in to your ProtAI dashboard to manage meters, quotas and API keys.',
  '',
  true
),
(
  '/signup',
  'Sign up',
  'Start Free with ProtAI',
  'Create a free ProtAI account — per-user credit metering for your AI app in 3 lines of code. No credit card.',
  'ProtAI signup, free AI metering',
  true
)
on conflict (page_path) do nothing;
