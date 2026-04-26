import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BLOG_ARTICLES, getBlogArticle } from "@/lib/content/blog";

interface BlogArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.description,
    keywords: [...article.keywords],
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getBlogArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <article
      data-testid="blog-article"
      className="container max-w-3xl py-12 sm:py-16"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Public recovery guide
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
        {article.title}
      </h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
        {article.excerpt}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Updated {article.updatedAt}
      </p>

      <div className="mt-8 rounded-2xl border bg-muted/40 p-5 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {article.trustCallout.title}
        </h2>
        <p className="mt-2">{article.trustCallout.body}</p>
        <Link
          href="/legal/disclaimer"
          className="mt-3 inline-flex font-medium text-primary underline-offset-4 hover:underline"
        >
          Medical Disclaimer
        </Link>
      </div>

      <div className="mt-10 space-y-9">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl font-semibold tracking-tight">
              {section.heading}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Want structure for the next 14 days?
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
          Start with a short quiz, then decide if the companion fits.
        </h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          The quiz helps shape a structured 14-day companion for your recovery
          window. It does not diagnose, prescribe treatment, or replace
          clinician care.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/onboarding">Start my 2-minute quiz</Link>
          </Button>
        </div>
      </section>
    </article>
  );
}
