/** RankMath-style on-page SEO analysis. Runs fully client-side. */

export type SeoCheck = {
  id: string;
  label: string;
  hint: string;
  passed: boolean;
  score: number;
  max: number;
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstParagraphText(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return m ? stripHtml(m[1]) : "";
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return 0;
  let count = 0;
  let idx = 0;
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count++;
    idx += n.length;
  }
  return count;
}

export type SeoInput = {
  title: string;
  slug: string;
  contentHtml: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
};

export function analyzeSeo(input: SeoInput): { score: number; checks: SeoCheck[]; wordCount: number } {
  const kw = input.focusKeyword.trim().toLowerCase();
  const text = stripHtml(input.contentHtml);
  const words = text ? text.split(/\s+/).length : 0;
  const seoTitle = (input.metaTitle.trim() || input.title.trim());
  const checks: SeoCheck[] = [];

  const hasKw = kw.length > 0;

  // 1. Keyword in SEO title — 15
  const kwInTitle = hasKw && seoTitle.toLowerCase().includes(kw);
  checks.push({
    id: "kw-title", label: "Focus keyword in SEO title",
    hint: hasKw ? (kwInTitle ? "Good — the keyword appears in the title." : `Add “${input.focusKeyword.trim()}” to the SEO title.`) : "Set a focus keyword to unlock keyword checks.",
    passed: kwInTitle, score: kwInTitle ? 15 : 0, max: 15,
  });

  // 2. Keyword in meta description — 10
  const kwInDesc = hasKw && input.metaDescription.toLowerCase().includes(kw);
  checks.push({
    id: "kw-desc", label: "Focus keyword in meta description",
    hint: hasKw ? (kwInDesc ? "Good — the keyword appears in the description." : "Include the keyword in the meta description.") : "Set a focus keyword first.",
    passed: kwInDesc, score: kwInDesc ? 10 : 0, max: 10,
  });

  // 3. Keyword in slug — 10
  const slugNorm = input.slug.toLowerCase().replace(/-/g, " ");
  const kwInSlug = hasKw && slugNorm.includes(kw);
  checks.push({
    id: "kw-slug", label: "Focus keyword in URL slug",
    hint: hasKw ? (kwInSlug ? "Good — the slug contains the keyword." : "Consider adding the keyword to the URL slug.") : "Set a focus keyword first.",
    passed: kwInSlug, score: kwInSlug ? 10 : 0, max: 10,
  });

  // 4. Keyword in first paragraph — 10
  const firstPara = firstParagraphText(input.contentHtml);
  const kwInIntro = hasKw && firstPara.toLowerCase().includes(kw);
  checks.push({
    id: "kw-intro", label: "Focus keyword in the opening paragraph",
    hint: hasKw ? (kwInIntro ? "Good — the keyword appears early." : "Mention the keyword in the first paragraph.") : "Set a focus keyword first.",
    passed: kwInIntro, score: kwInIntro ? 10 : 0, max: 10,
  });

  // 5. Content length — 15
  let lenScore = 0;
  let lenHint = "Aim for at least 600 words for competitive topics.";
  if (words >= 600) { lenScore = 15; lenHint = `Good — ${words} words.`; }
  else if (words >= 300) { lenScore = 8; lenHint = `${words} words — decent, but 600+ ranks better.`; }
  else if (words >= 100) { lenScore = 3; lenHint = `Only ${words} words — thin content rarely ranks.`; }
  checks.push({ id: "length", label: "Content length", hint: lenHint, passed: words >= 600, score: lenScore, max: 15 });

  // 6. SEO title length — 10
  const tl = seoTitle.length;
  let tlScore = 0;
  let tlHint = "Write an SEO title first.";
  if (tl >= 50 && tl <= 60) { tlScore = 10; tlHint = `Good — ${tl} characters.`; }
  else if (tl >= 30 && tl <= 70) { tlScore = 6; tlHint = `${tl} characters — 50–60 is the sweet spot.`; }
  else if (tl > 0) { tlScore = 2; tlHint = `${tl} characters — keep it between 50–60 to avoid truncation.`; }
  checks.push({ id: "title-len", label: "SEO title length (50–60 chars)", hint: tlHint, passed: tl >= 50 && tl <= 60, score: tlScore, max: 10 });

  // 7. Meta description length — 10
  const dl = input.metaDescription.trim().length;
  let dlScore = 0;
  let dlHint = "Write a meta description to control the search snippet.";
  if (dl >= 120 && dl <= 160) { dlScore = 10; dlHint = `Good — ${dl} characters.`; }
  else if (dl >= 70 && dl <= 200) { dlScore = 6; dlHint = `${dl} characters — 120–160 is ideal.`; }
  else if (dl > 0) { dlScore = 2; dlHint = `${dl} characters — aim for 120–160.`; }
  checks.push({ id: "desc-len", label: "Meta description length (120–160 chars)", hint: dlHint, passed: dl >= 120 && dl <= 160, score: dlScore, max: 10 });

  // 8. Keyword density — 10
  let densScore = 0;
  let densHint = "Set a focus keyword to check density.";
  let density = 0;
  if (hasKw && words > 0) {
    const occ = countOccurrences(text, kw);
    density = (occ * kw.split(/\s+/).length) / words * 100;
    if (density >= 0.5 && density <= 2.5) { densScore = 10; densHint = `Good — ${density.toFixed(1)}% density.`; }
    else if (density > 0) { densScore = 4; densHint = `${density.toFixed(1)}% density — aim for 0.5–2.5%. ${density > 2.5 ? "Looks stuffed; use variations." : "Mention the keyword a few more times naturally."}`; }
    else { densHint = "The keyword doesn't appear in the content yet."; }
  }
  checks.push({ id: "density", label: "Keyword density (0.5–2.5%)", hint: densHint, passed: densScore === 10, score: densScore, max: 10 });

  // 9. Subheadings — 10
  const h2Count = (input.contentHtml.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (input.contentHtml.match(/<h3[\s>]/gi) || []).length;
  const hasSubs = h2Count > 0;
  checks.push({
    id: "headings", label: "Subheadings structure",
    hint: hasSubs ? `Good — ${h2Count} H2${h2Count === 1 ? "" : "s"}${h3Count ? `, ${h3Count} H3${h3Count === 1 ? "" : "s"}` : ""}.` : "Break the content up with H2 subheadings.",
    passed: hasSubs, score: hasSubs ? 10 : 0, max: 10,
  });

  const score = checks.reduce((s, c) => s + c.score, 0);
  return { score, checks, wordCount: words };
}

export function seoGrade(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "text-emerald-300" };
  if (score >= 60) return { label: "Good", color: "text-lime-300" };
  if (score >= 40) return { label: "Needs work", color: "text-amber-300" };
  return { label: "Poor", color: "text-red-300" };
}
