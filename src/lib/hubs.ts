// Rich, topic-authority content for the primary category hubs.
// Powers SEO (pillar pages), GEO/AIO (extractable definitions + FAQPage schema),
// and user orientation (intro, cornerstone posts, common questions).
//
// FAQ answers are educational and non-prescriptive to match the site disclaimer,
// and should be reviewed by Robin before publish.

export type HubFaq = { q: string; a: string };

export type HubContent = {
  metaTitle: string;
  metaDescription: string;
  lede: string;
  intro: string; // HTML paragraphs
  featured: string[]; // cornerstone article slugs
  faqs: HubFaq[];
  leadMagnet: string;
};

const AUTHOR_LINE =
  '<p class="hub-author">Written and reviewed by <a href="/about/">Robin Berzin, MD</a> — Columbia-trained physician and founder of Parsley Health.</p>';

export const hubContent: Record<string, HubContent> = {
  "longevity-metabolic-health": {
    metaTitle: "Longevity & Metabolic Health for Women | Robin Berzin, MD",
    metaDescription:
      "Evidence-based longevity and metabolic health for women — muscle, VO₂ max, biological age, CGMs, and the labs and habits that actually move healthspan.",
    lede: "The science of healthspan — and the metrics, labs, and habits that actually slow aging.",
    intro:
      "<p>Longevity isn't about living longer in decline — it's about extending <em>healthspan</em>, the years you spend strong, sharp, and metabolically healthy. For women, that work starts with metabolism: how efficiently your body produces energy, manages blood sugar, builds muscle, and clears the damage that accumulates with age.</p>" +
      "<p>The encouraging part is how measurable it has become. Biological age, VO₂ max, muscle mass, fasting insulin, ApoB, and continuous glucose data give you a real-time read on how fast you're aging — and most of these levers respond within months to changes you control. This hub collects evidence-based guidance on what to track, what to ignore, and where to focus first.</p>" +
      AUTHOR_LINE,
    featured: ["how-to-lower-biological-age", "muscle-mass-is-the-ultimate-longevity-metric", "if-you-only-track-one-fitness-metric-make-it-vo2-max"],
    faqs: [
      { q: "What's the difference between lifespan and healthspan?", a: "Lifespan is how long you live; healthspan is how long you stay healthy, active, and free of chronic disease. Longevity medicine targets healthspan — compressing illness into the smallest window at the end of life rather than simply adding years." },
      { q: "What's the single best metric to track for longevity?", a: "If you track one number, make it VO₂ max — your maximal oxygen uptake. It's one of the strongest predictors of all-cause mortality, and unlike age it's trainable at any decade through zone 2 and interval cardio." },
      { q: "Does muscle mass really affect how long you live?", a: "Yes. Muscle is metabolic armor: it stores glucose, supports metabolism, protects against falls and frailty, and independently predicts longevity. After about age 30 women lose muscle steadily without resistance training, which makes strength work non-negotiable." },
      { q: "What is biological age, and can you lower it?", a: "Biological age estimates how old your body is functioning — versus your calendar age — using markers like inflammation, glucose, and epigenetic clocks. It can move in both directions: sleep, exercise, muscle, and metabolic health can measurably lower it." },
      { q: "Are continuous glucose monitors worth it if you're not diabetic?", a: "For many people, yes. A CGM reveals how your specific body responds to foods, stress, and sleep, exposing glucose spikes that drive inflammation and aging long before they would show up as prediabetes on a standard lab." },
    ],
    leadMagnet: "female-longevity-supplement-stack",
  },

  "womens-health-hormones": {
    metaTitle: "Women's Health & Hormones | Robin Berzin, MD",
    metaDescription:
      "Functional medicine for women's hormones — perimenopause, estrogen, testosterone, thyroid, bone density, and the labs every woman should track.",
    lede: "Hormones, perimenopause, and the labs every woman should actually be tracking.",
    intro:
      "<p>Women's health has been chronically under-studied and under-treated — most research was done in men, and symptoms like fatigue, brain fog, and disrupted sleep are still too often dismissed as \"normal.\" Functional medicine takes a different stance: these symptoms are signals, usually traceable to hormones, metabolism, and nutrient status that standard care never measures.</p>" +
      "<p>This hub covers the hormonal arc of a woman's life — from optimizing cycles and fertility, through the turbulence of perimenopause, into the longevity window of menopause and beyond. It also covers the diagnostics that make the invisible visible: the estrogen, thyroid, iron, and metabolic markers that explain how you actually feel.</p>" +
      AUTHOR_LINE,
    featured: ["essential-longevity-labs-for-women", "perimenopause-symptoms-research", "is-estrogen-the-ultimate-longevity-drug"],
    faqs: [
      { q: "When does perimenopause start?", a: "Perimenopause usually begins in the early-to-mid 40s but can start in the late 30s. It's the 4–10 year transition before menopause, when hormones fluctuate widely — often causing symptoms years before periods actually stop." },
      { q: "Is hormone therapy safe?", a: "For most healthy women who start within about 10 years of menopause, current evidence supports that the benefits of hormone therapy — for symptoms, bone, and possibly brain and heart — outweigh the risks. The right choice is individual and worth discussing with a clinician." },
      { q: "Why are my labs \"normal\" but I still feel exhausted?", a: "Standard reference ranges are wide and built around disease thresholds, not optimal function. Fatigue often traces to low-normal ferritin, suboptimal thyroid, low vitamin D or B12, or blood-sugar swings — all easy to miss on a basic panel." },
      { q: "Can estrogen support longevity?", a: "Estrogen does more than regulate cycles — it supports bone, brain, cardiovascular, and metabolic health. Emerging research frames timely estrogen therapy as a potential longevity tool for women, not just a symptom treatment." },
      { q: "What labs should every woman track?", a: "Beyond a basic panel: thyroid (TSH, free T3/T4, antibodies), ferritin, vitamin D, B12, fasting insulin and glucose, a lipid panel with ApoB, hs-CRP, and sex hormones timed to your cycle or menopausal status." },
    ],
    leadMagnet: "female-longevity-supplement-stack",
  },

  "brain-mood-nervous-system": {
    metaTitle: "Brain, Mood & Nervous System | Robin Berzin, MD",
    metaDescription:
      "Root-cause approaches to brain health, mood, focus, stress, and the nervous system — from metabolism and the vagus nerve to slowing brain aging.",
    lede: "Where mental health meets metabolism — protecting mood, focus, and the aging brain.",
    intro:
      "<p>Your brain isn't separate from your body. Mood, focus, and resilience are downstream of physical inputs — blood sugar, inflammation, sleep, hormones, and the state of your nervous system. That's the core of Robin's <em>State Change</em> framework: to change how you feel, start with the biology underneath.</p>" +
      "<p>This hub explores the two-way street between brain and body: how metabolic dysfunction shows up as anxiety and brain fog, how the vagus nerve governs your stress response, and what genuinely protects cognition as you age. The goal is practical neuroscience — levers you can pull today, not just a diagnosis.</p>" +
      AUTHOR_LINE,
    featured: ["slow-brain-aging-40s", "metabolism-mental-health-protocol", "hacking-the-vagus-nerve"],
    faqs: [
      { q: "Can blood sugar affect anxiety and mood?", a: "Yes. Glucose swings trigger adrenaline and cortisol, which can feel like anxiety, irritability, or panic. Stabilizing blood sugar — with protein, fiber, and fewer refined carbs — is one of the most underrated mental-health interventions." },
      { q: "What is the vagus nerve and why does it matter?", a: "The vagus nerve is the main highway of your parasympathetic \"rest and digest\" system, linking brain and gut. Stimulating it — through slow breathing, cold exposure, humming, or movement — shifts you out of fight-or-flight and lowers stress reactivity." },
      { q: "How early does brain aging start, and can you slow it?", a: "Subtle brain changes can begin in your 40s, decades before symptoms. The same levers that protect the heart — exercise, blood-sugar control, sleep, omega-3s, and managing blood pressure — are the best-evidenced ways to protect the brain." },
      { q: "What's the best diet for brain health?", a: "Patterns matter more than single foods. Mediterranean-style and MIND diets — rich in omega-3s, polyphenols, leafy greens, and protein, and low in ultra-processed food — have the strongest evidence for protecting mood and cognition." },
      { q: "Is the gut really connected to mental health?", a: "Strongly. The gut produces neurotransmitters and signals the brain via the vagus nerve and immune system. Dysbiosis and inflammation are linked to depression and anxiety, which is why gut health is part of any root-cause mental-health plan." },
    ],
    leadMagnet: "female-longevity-supplement-stack",
  },

  "toxins-nutrition-modern-exposures": {
    metaTitle: "Toxins, Nutrition & Modern Exposures | Robin Berzin, MD",
    metaDescription:
      "Cut through nutrition noise and lower your toxic load — microplastics, mold, seed oils, protein, and supplements, with evidence over hype.",
    lede: "Lowering your toxic load and eating well in a modern, over-processed world.",
    intro:
      "<p>We live in an unprecedented chemical environment — microplastics in our blood, mold in our buildings, endocrine disruptors in everyday products, and an ultra-processed food supply engineered to be overeaten. You can't avoid all of it, but you can dramatically lower your cumulative exposure with a handful of high-leverage changes.</p>" +
      "<p>This hub cuts through the noise — the seed-oil panic, the supplement hype, the protein confusion — and focuses on what the evidence actually supports. The aim is a calm, practical playbook: where modern exposures genuinely matter, where they don't, and how to nourish your body without obsessing.</p>" +
      AUTHOR_LINE,
    featured: ["my-personal-microplastics-protocol", "protein-powder-guide-complete-protein", "mold-symptoms"],
    faqs: [
      { q: "How worried should I be about microplastics?", a: "Concerned enough to act, not to panic. Microplastics are now found throughout the body, and you can meaningfully cut exposure: filter your water, never heat food in plastic, and choose glass or stainless steel over plastic containers." },
      { q: "Are seed oils actually bad for you?", a: "The picture is more nuanced than the headlines. The bigger issue is that seed oils are a marker of ultra-processed food, which drives most diet-related disease. Whole-food eating naturally lowers seed-oil intake without fearing every ingredient." },
      { q: "How much protein do women actually need?", a: "Most women under-eat protein. Roughly 1.2–2.0 g per kg of body weight supports muscle, metabolism, and satiety — toward the higher end in perimenopause and with strength training. Aim for about 30g of high-quality protein per meal." },
      { q: "What are the signs of mold or mycotoxin illness?", a: "Mold exposure can cause fatigue, brain fog, sinus and respiratory issues, headaches, and unexplained inflammation. It's frequently missed; if symptoms track with a water-damaged building, it's worth investigating your environment and testing." },
      { q: "Do I actually need supplements, or just food?", a: "Food first — but modern soil, diets, and absorption gaps make a few supplements genuinely useful for many women, commonly vitamin D, omega-3s, magnesium, and B12. Test where you can rather than guessing." },
    ],
    leadMagnet: "female-longevity-supplement-stack",
  },

  "fertility-parenting-robin-berzin-md": {
    metaTitle: "Fertility & Parenting | Robin Berzin, MD",
    metaDescription:
      "Root-cause fertility and maternal health — egg quality, metabolic health, toxin exposure, nervous system regulation, MTHFR, and thriving through motherhood, from Robin Berzin, MD.",
    lede: "Root-cause fertility, preconception health, and the whole-body systems that shape egg quality.",
    intro:
      "<p>Fertility is a vital sign. The same systems that govern whether you conceive easily — metabolic health, thyroid function, nutrient status, inflammation, toxin exposure, and stress physiology — are the systems that shape lifelong health for both mother and baby. Functional medicine treats the months before conception as one of the highest-leverage windows in a woman's life.</p>" +
      "<p>This hub is organized around the fertility terrain most conventional workups miss: blood sugar and insulin, endocrine-disrupting chemicals, nervous system regulation, egg quality after 35, and genetics like MTHFR and methylfolate. The throughline is simple: age matters, but the environment around the egg matters too.</p>" +
      AUTHOR_LINE,
    featured: ["fertility-over-35-protocol", "blood-sugar-fertility", "chemicals-in-your-home-fertility", "nervous-system-fertility-organ", "mthfr"],
    faqs: [
      { q: "Can you improve egg quality after 35?", a: "You can't make new eggs, but egg quality is influenced by the metabolic environment over the roughly 90 days before ovulation. Blood-sugar control, sleep, targeted nutrients, and lowering inflammation can meaningfully support it." },
      { q: "Can blood sugar affect fertility even if my cycle is regular?", a: "Yes. Insulin resistance can disrupt ovulation, androgen balance, egg maturation, and implantation before a standard fertility workup flags a problem. Fasting insulin, HbA1c, fructosamine, and sometimes CGM data give a clearer picture than fasting glucose alone." },
      { q: "Do household chemicals really affect fertility?", a: "They can. PFAS, phthalates, BPA, and heavy metals are endocrine disruptors that can interfere with hormone signaling, mitochondrial function, and egg quality. The highest-impact first steps are food-storage swaps, filtered water, cleaner personal-care products, and reducing non-stick cookware exposure." },
      { q: "How does stress affect conception?", a: "Chronic stress is biological, not just emotional. Elevated cortisol can blunt the GnRH and LH signaling needed for ovulation, lower progesterone support, and disrupt sleep and melatonin, which protect the follicular environment." },
      { q: "What is MTHFR and does it affect fertility?", a: "MTHFR is a common gene variant that reduces how well you convert folic acid into its active form, methylfolate — important for ovulation, implantation, and preventing neural-tube defects. Many people carry a variant and benefit from methylated folate." },
      { q: "How far in advance should I prepare for pregnancy?", a: "Ideally about three months. Eggs and sperm mature over roughly 90 days, so the preconception window is when nutrition, blood sugar, thyroid, and nutrient status have the most influence on outcomes." },
      { q: "What labs matter most before trying to conceive?", a: "Beyond standard prenatal labs: thyroid with antibodies, ferritin, vitamin D, B12 and folate, fasting insulin and glucose, hs-CRP, omega-3 status, and targeted toxin or nutrient testing when history suggests it." },
    ],
    leadMagnet: "female-longevity-supplement-stack",
  },
};

export function getHubContent(slug: string): HubContent | undefined {
  return hubContent[slug];
}
