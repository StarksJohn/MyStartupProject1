export interface BlogArticleSection {
  readonly heading: string;
  readonly body: readonly string[];
}

export interface BlogArticle {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly excerpt: string;
  readonly updatedAt: string;
  readonly keywords: readonly string[];
  readonly sections: readonly BlogArticleSection[];
  readonly trustCallout: {
    readonly title: string;
    readonly body: string;
  };
}

export const BLOG_ARTICLES = [
  {
    slug: "finger-stiff-after-cast-removal",
    title:
      "Finger Still Stiff After Cast Removal? What to Know Before You Start Moving Again",
    description:
      "A calm, informational guide for people searching after finger or metacarpal cast removal, with safety boundaries and a path to structured support.",
    excerpt:
      "Post-cast stiffness can feel alarming. Learn why this moment is confusing, what warning signs deserve clinician attention, and how a structured 14-day companion can help you stay organized.",
    updatedAt: "2026-04-26",
    keywords: [
      "finger stiff after cast removal",
      "metacarpal fracture recovery",
      "post cast hand stiffness",
      "cast removal exercises questions",
    ],
    sections: [
      {
        heading: "Why stiffness after cast removal feels so confusing",
        body: [
          "Post-cast stiffness can feel alarming because the moment often arrives with very little day-by-day guidance. One clinician may say to start moving gently, while search results jump between generic advice, forum stories, and exercise lists that do not match your exact timing.",
          "Fracture Recovery Companion is designed for that uncertainty window. It helps adults around finger or metacarpal cast removal organize daily recovery actions and questions without pretending to replace clinical care.",
        ],
      },
      {
        heading: "What a structured companion can help with",
        body: [
          "A structured 14-day companion can make the next step feel less scattered: what to focus on today, what concerns to write down, and when a symptom should move from normal worry to clinician contact.",
          "The companion starts with a quiz because timing, injury type, hardware status, pain level, and daily constraints all affect what kind of guidance is useful. It is not a diagnosis or treatment plan.",
        ],
      },
      {
        heading: "When to contact your clinician",
        body: [
          "Contact your clinician if pain is severe, numbness appears, skin color changes, swelling gets rapidly worse, fever appears, or anything feels urgent. Public content can help you prepare better questions, but it should not delay care.",
          "If you are unsure whether you are allowed to move yet, or your injury was not assessed by a clinician, use direct medical guidance first.",
        ],
      },
    ],
    trustCallout: {
      title: "Informational support, not medical care",
      body: "This article is educational and supportive. It is not a medical device, not for diagnosis, and not a substitute for your doctor or physical therapist.",
    },
  },
] as const satisfies readonly BlogArticle[];

export function getBlogArticle(slug: string) {
  return BLOG_ARTICLES.find((article) => article.slug === slug);
}
