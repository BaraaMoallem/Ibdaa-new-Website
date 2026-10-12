export type Locale = "en" | "ar";
export type PageKey = "home" | "about" | "restorations" | "contact";

export const business = {
  name: "IBDAA Dental Lab",
  city: "Nasr City, Cairo",
  founded: 2016,
  founder: "DT Yasser Zaineh",
  phone: [
    { display: "+20 103 027 7027", href: "tel:+201030277027" },
    { display: "+20 114 222 0100", href: "tel:+201142220100" },
  ],
  email: "damas.ibdaa@gmail.com",
  facebook: "https://www.facebook.com/share/1FA8zajrSG/",
  instagram: "https://www.instagram.com/ibdaa.eg?srtk=MTRjNzRjNGZpbGhxcA==",
  maps: "https://maps.app.goo.gl/DWQkvrduiSt8XwKBA",
  // TODO: Confirm which supplied phone number is the primary WhatsApp destination.
  primaryWhatsAppNumber: "201030277027",
} as const;

export const restorationIds = [
  "zirconia",
  "zircomax",
  "emax",
  "veneers",
  "pfm",
] as const;
export type RestorationId = (typeof restorationIds)[number];

// The hero uses the supplied image; replace the remaining placeholders with verified photography when supplied.
export const media = {
  hero: "/images/ibdaa-hero-precision-implant-blue-glove.webp",
  lab: "/images/placeholders/lab-placeholder.svg",
  founder: "/images/placeholders/founder-placeholder.svg",
  cadcam: "/images/placeholders/cadcam-placeholder.svg",
  restorations: {
    zirconia: "/images/placeholders/zirconia-placeholder.svg",
    zircomax: "/images/placeholders/zircomax-placeholder.svg",
    emax: "/images/placeholders/emax-placeholder.svg",
    veneers: "/images/placeholders/veneers-placeholder.svg",
    pfm: "/images/placeholders/pfm-placeholder.svg",
  },
} as const;

export const routes: Record<Locale, Record<PageKey, string>> = {
  en: {
    home: "/",
    about: "/about",
    restorations: "/restorations",
    contact: "/contact",
  },
  ar: {
    home: "/ar",
    about: "/ar/about",
    restorations: "/ar/restorations",
    contact: "/ar/contact",
  },
};

export const nav: Record<Locale, { key: PageKey; label: string }[]> = {
  en: [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "restorations", label: "Dental Restorations" },
    { key: "contact", label: "Contact" },
  ],
  ar: [
    { key: "home", label: "الرئيسية" },
    { key: "about", label: "من نحن" },
    { key: "restorations", label: "التركيبات السنية" },
    { key: "contact", label: "تواصل معنا" },
  ],
};

export const content = {
  en: {
    ui: {
      sendCase: "Send a Case",
      explore: "Explore Restorations",
      learnMore: "Learn more",
      viewAll: "View all restorations",
      menu: "Menu",
      switchLanguage: "Switch language",
      skip: "Skip to content",
      contact: "Contact the lab",
      call: "Call",
      email: "Email",
      map: "View on Google Maps",
      facebook: "Facebook",
      instagram: "Instagram",
      whatsapp: "WhatsApp",
      location: "Nasr City, Cairo",
      audience: "For dentists and dental professionals",
    },
    imageAlt: {
      hero: "Ceramic implant restoration held in a blue-gloved hand against a navy technical background",
      lab: "Illustrative placeholder for the IBDAA Dental Lab workspace",
      founder:
        "Portrait placeholder for DT Yasser Zaineh, founder of IBDAA Dental Lab",
      cadcam: "Illustrative placeholder for IBDAA's CAD/CAM workflow",
      restorations: {
        zirconia:
          "Illustrative placeholder for Zirconia restoration photography",
        zircomax:
          "Illustrative placeholder for Zircomax restoration photography",
        emax: "Illustrative placeholder for E.max restoration photography",
        veneers: "Illustrative placeholder for Veneers restoration photography",
        pfm: "Illustrative placeholder for PFM restoration photography",
      },
    },
    home: {
      eyebrow: "DENTAL LABORATORY · NASR CITY, CAIRO",
      title: "Precision restorations. Considered value.",
      intro:
        "IBDAA Dental Lab partners with dentists on quality-focused dental restorations, combining CAD/CAM precision, aesthetics, and competitive value.",
      heroNote: "Made for dental professionals in Cairo and beyond.",
      factsTitle: "A lab built around the work behind every case.",
      facts: [
        { value: "2016", label: "IBDAA founded" },
        { value: "30+", label: "Years of founder experience" },
        { value: "CAD/CAM", label: "Digital workflow" },
      ],
      restorationsEyebrow: "RESTORATIVE OPTIONS",
      restorationsTitle: "Materials and methods for considered outcomes.",
      restorationsIntro:
        "Explore IBDAA’s restoration categories and discuss the requirements of your case directly with the lab.",
      whyEyebrow: "WHY IBDAA",
      whyTitle: "Care in the details. Value in the result.",
      whyIntro:
        "Our focus is straightforward: precise work, natural-looking aesthetics, and reliable quality without unnecessary cost.",
      why: [
        {
          title: "Experience-led work",
          body: "The lab draws on founder DT Yasser Zaineh’s more than 30 years of experience.",
        },
        {
          title: "Digital precision",
          body: "CAD/CAM is part of IBDAA’s workflow, supporting precision and consistency.",
        },
        {
          title: "Clear collaboration",
          body: "We work with dentists to understand restoration requirements and case details.",
        },
      ],
      founderEyebrow: "THE PERSON BEHIND THE LAB",
      founderTitle: "Founded on craft and experience.",
      founderBody:
        "DT Yasser Zaineh, a Damascus University graduate with more than 30 years of experience, founded IBDAA Dental Lab in 2016. The lab serves dentists with a focus on quality, precision, and value.",
      areasEyebrow: "WHERE WE WORK",
      areasTitle: "Connected to dentists across Egypt.",
      areas: [
        { title: "Cairo", body: "Based in Nasr City, Cairo." },
        { title: "Assiut", body: "Serving dentists in Assiut." },
        { title: "Port Said", body: "Shipping available to Port Said." },
      ],
      finalTitle: "Have a case in mind?",
      finalBody:
        "Tell us what your case requires. Start a conversation with IBDAA Dental Lab.",
    },
    about: {
      eyebrow: "ABOUT IBDAA",
      title: "A dental laboratory shaped by experience.",
      lead: "IBDAA Dental Lab was founded in 2016 by DT Yasser Zaineh to serve dentists with quality-focused restorations at competitive value.",
      storyTitle: "A focused partner for dental professionals.",
      story:
        "Based in Nasr City, Cairo, IBDAA works for dentists and dental professionals. Our approach brings together restorative craft, attention to fit and aesthetics, and CAD/CAM capability. We aim for dependable communication around the details that matter to each case.",
      founderTitle: "DT Yasser Zaineh",
      founderBody:
        "IBDAA’s founder is a Damascus University graduate with more than 30 years of experience. He established the laboratory in 2016 with a professional focus on quality, precision, and value.",
      serviceTitle: "Where we serve",
      serviceBody:
        "IBDAA serves dentists in Cairo and Assiut, with shipping available to Port Said.",
    },
    restorations: {
      eyebrow: "DENTAL RESTORATIONS",
      title: "Restorative options for your clinical plan.",
      lead: "IBDAA Dental Lab provides a considered range of restorations for dentists, supported by CAD/CAM capability and direct discussion of case requirements.",
      note: "Restoration selection depends on the clinical case. Contact the lab to discuss requirements.",
      digitalEyebrow: "DIGITAL WORKFLOW",
      digitalTitle: "CAD/CAM in the workflow.",
      digitalBody:
        "IBDAA uses CAD/CAM to support digital precision and consistency in its restorative workflow. Talk with the lab about the details of your case.",
      items: {
        zirconia: {
          name: "Zirconia",
          description:
            "A modern all-ceramic restorative option designed for strength, precision, and natural aesthetics. Suitable for a variety of crown and bridge applications.",
        },
        zircomax: {
          name: "Zircomax",
          description:
            "A high-strength zirconia-based restorative solution intended to balance durability, fit, and aesthetics for demanding restorative cases.",
        },
        emax: {
          name: "E.max",
          description:
            "A highly aesthetic ceramic option commonly selected for restorations where natural appearance and optical properties are a priority, including selected crowns, veneers, inlays, and onlays.",
        },
        veneers: {
          name: "Veneers",
          description:
            "Thin aesthetic restorations designed to reproduce natural tooth form and appearance with attention to contour, shade, and surface detail.",
        },
        pfm: {
          name: "PFM",
          description:
            "Porcelain-fused-to-metal restorations combining a metal substructure with aesthetic ceramic layering.",
        },
      },
    },
    contact: {
      eyebrow: "CONTACT IBDAA",
      title: "Start with the details of your case.",
      lead: "We work with dentists and dental professionals. Reach IBDAA Dental Lab in Nasr City, Cairo to discuss restorations, case requirements, or shipping to Port Said.",
      caseTitle: "Send a Case",
      caseBody:
        "Open a WhatsApp conversation with the lab and share the details you are ready to discuss.",
      directTitle: "Other ways to reach us",
      visitTitle: "Our location",
      visitBody: "Nasr City, Cairo. Use the map link for location details.",
      areaTitle: "Service coverage",
      areaBody:
        "Serving dentists in Cairo and Assiut, with shipping available to Port Said.",
    },
  },
  ar: {
    ui: {
      sendCase: "أرسل حالة",
      explore: "تعرّف على التركيبات",
      learnMore: "اعرف المزيد",
      viewAll: "جميع التركيبات",
      menu: "القائمة",
      switchLanguage: "تغيير اللغة",
      skip: "انتقل إلى المحتوى",
      contact: "تواصل مع المختبر",
      call: "اتصال",
      email: "البريد الإلكتروني",
      map: "الموقع على خرائط Google",
      facebook: "فيسبوك",
      instagram: "إنستغرام",
      whatsapp: "واتساب",
      location: "مدينة نصر، القاهرة",
      audience: "لأطباء الأسنان والمتخصصين",
    },
    imageAlt: {
      hero: "تركيبة خزفية لزرعة سنية تحملها يد بقفاز أزرق على خلفية كحلية بتفاصيل تقنية",
      lab: "صورة توضيحية مؤقتة لمساحة العمل في مختبر إبداع للأسنان",
      founder: "صورة مؤقتة لموضع صورة مؤسس المختبر DT Yasser Zaineh",
      cadcam: "صورة توضيحية مؤقتة لسير العمل بتقنيات CAD/CAM في إبداع",
      restorations: {
        zirconia: "صورة توضيحية مؤقتة لتركيبات الزيركونيا",
        zircomax: "صورة توضيحية مؤقتة لتركيبات زيركوماكس",
        emax: "صورة توضيحية مؤقتة لتركيبات إي ماكس",
        veneers: "صورة توضيحية مؤقتة للقشور التجميلية",
        pfm: "صورة توضيحية مؤقتة لتركيبات الخزف المصهور على المعدن",
      },
    },
    home: {
      eyebrow: "مختبر أسنان · مدينة نصر، القاهرة",
      title: "تركيبات دقيقة. قيمة مدروسة.",
      intro:
        "مختبر إبداع للأسنان شريك لأطباء الأسنان في تنفيذ تركيبات تراعي الجودة والدقة والجماليات، بالاعتماد على تقنيات CAD/CAM وبقيمة تنافسية.",
      heroNote: "نعمل مع أطباء الأسنان في القاهرة وخارجها.",
      factsTitle: "مختبر يهتم بالتفاصيل التي تصنع الفارق في كل حالة.",
      facts: [
        { value: "2016", label: "تأسيس إبداع" },
        { value: "+30", label: "عاماً من خبرة المؤسس" },
        { value: "CAD/CAM", label: "ضمن سير العمل الرقمي" },
      ],
      restorationsEyebrow: "خيارات التركيبات",
      restorationsTitle: "مواد وتقنيات تناسب متطلبات كل حالة.",
      restorationsIntro:
        "تعرّف على فئات التركيبات المتاحة، وتواصل معنا لمناقشة تفاصيل الحالة ومتطلباتها.",
      whyEyebrow: "لماذا إبداع؟",
      whyTitle: "عناية بالتفاصيل، وقيمة في النتيجة.",
      whyIntro:
        "ينصبّ اهتمامنا على دقة التنفيذ والمظهر الطبيعي والجودة الموثوقة بتكلفة مدروسة.",
      why: [
        {
          title: "خبرة تقود العمل",
          body: "يستند المختبر إلى خبرة مؤسسه، فني الأسنان DT Yasser Zaineh، الممتدة لأكثر من 30 عاماً.",
        },
        {
          title: "دقة رقمية",
          body: "تدخل تقنيات CAD/CAM ضمن سير العمل لدعم الدقة والاتساق.",
        },
        {
          title: "تواصل واضح",
          body: "نتعاون مع أطباء الأسنان لفهم متطلبات التركيبات وتفاصيل الحالات.",
        },
      ],
      founderEyebrow: "مؤسس المختبر",
      founderTitle: "خبرة مهنية وراء كل تفصيل.",
      founderBody:
        "أسّس فني الأسنان DT Yasser Zaineh مختبر إبداع للأسنان عام 2016. وهو خريج جامعة دمشق، ويتمتع بخبرة تزيد على 30 عاماً. يخدم المختبر أطباء الأسنان مع التركيز على الجودة والدقة والقيمة.",
      areasEyebrow: "نطاق الخدمة",
      areasTitle: "على تواصل مع أطباء الأسنان في مصر.",
      areas: [
        { title: "القاهرة", body: "مقر المختبر في مدينة نصر، القاهرة." },
        { title: "أسيوط", body: "نخدم أطباء الأسنان في أسيوط." },
        { title: "بورسعيد", body: "الشحن متاح إلى بورسعيد." },
      ],
      finalTitle: "لديك حالة تريد مناقشتها؟",
      finalBody: "شاركنا متطلبات الحالة وابدأ الحديث مع مختبر إبداع للأسنان.",
    },
    about: {
      eyebrow: "عن إبداع",
      title: "مختبر أسنان تقوم رؤيته على الخبرة.",
      lead: "أسّس فني الأسنان DT Yasser Zaineh مختبر إبداع للأسنان عام 2016 لخدمة أطباء الأسنان بتركيبات تركز على الجودة وبقيمة تنافسية.",
      storyTitle: "شريك متخصص لأطباء الأسنان.",
      story:
        "يقع مختبر إبداع في مدينة نصر بالقاهرة، ويعمل مع أطباء الأسنان والمتخصصين. يجمع نهجه بين مهارة صناعة التركيبات والاهتمام بالملاءمة والجماليات وتقنيات CAD/CAM، مع تواصل واضح حول تفاصيل كل حالة.",
      founderTitle: "فني الأسنان DT Yasser Zaineh",
      founderBody:
        "مؤسس مختبر إبداع خريج جامعة دمشق، ويتمتع بخبرة تزيد على 30 عاماً. أسّس المختبر عام 2016 مع تركيز مهني على الجودة والدقة والقيمة.",
      serviceTitle: "نطاق خدمتنا",
      serviceBody:
        "يخدم إبداع أطباء الأسنان في القاهرة وأسيوط، مع إتاحة الشحن إلى بورسعيد.",
    },
    restorations: {
      eyebrow: "التركيبات السنية",
      title: "خيارات تركيبية وفق خطة العلاج.",
      lead: "يوفر مختبر إبداع للأسنان مجموعة من التركيبات لأطباء الأسنان، مع استخدام CAD/CAM وإمكانية مناقشة متطلبات كل حالة مباشرة مع المختبر.",
      note: "يعتمد اختيار التركيبة على الحالة السريرية. تواصل مع المختبر لمناقشة المتطلبات.",
      digitalEyebrow: "سير العمل الرقمي",
      digitalTitle: "تقنيات CAD/CAM ضمن سير العمل.",
      digitalBody:
        "يستخدم إبداع تقنيات CAD/CAM لدعم الدقة الرقمية والاتساق في سير عمل التركيبات. يمكن مناقشة تفاصيل الحالة مع المختبر مباشرة.",
      items: {
        zirconia: {
          name: "الزيركونيا",
          description:
            "خيار خزفي حديث خالٍ من المعدن، يراعي القوة والدقة والمظهر الطبيعي، ويناسب مجموعة متنوعة من تطبيقات التيجان والجسور.",
        },
        zircomax: {
          name: "زيركوماكس",
          description:
            "خيار تركيبي قائم على الزيركونيا وعالي المتانة، يهدف إلى الموازنة بين التحمل والملاءمة والجماليات في الحالات التي تتطلب عناية خاصة.",
        },
        emax: {
          name: "إي ماكس",
          description:
            "خيار خزفي عالي الجماليات يُختار عادةً حين تكون الأولوية للمظهر الطبيعي والخصائص البصرية، بما في ذلك بعض التيجان والقشور والحشوات الداخلية والخارجية.",
        },
        veneers: {
          name: "القشور التجميلية",
          description:
            "تركيبات تجميلية رقيقة مصممة لمحاكاة شكل السن الطبيعي، مع الاهتمام بالتحديد واللون وتفاصيل السطح.",
        },
        pfm: {
          name: "الخزف المصهور على المعدن (PFM)",
          description:
            "تركيبات تجمع بين هيكل معدني وطبقات خزفية لإضفاء المظهر الجمالي.",
        },
      },
    },
    contact: {
      eyebrow: "تواصل مع إبداع",
      title: "لنبدأ بتفاصيل حالتك.",
      lead: "نتعامل مع أطباء الأسنان والمتخصصين. تواصل مع مختبر إبداع للأسنان في مدينة نصر بالقاهرة لمناقشة التركيبات ومتطلبات الحالات أو الشحن إلى بورسعيد.",
      caseTitle: "أرسل حالة",
      caseBody:
        "افتح محادثة واتساب مع المختبر وشارك التفاصيل التي ترغب في مناقشتها.",
      directTitle: "طرق أخرى للتواصل",
      visitTitle: "موقع المختبر",
      visitBody: "مدينة نصر، القاهرة. افتح رابط الخريطة لمعرفة تفاصيل الموقع.",
      areaTitle: "نطاق الخدمة",
      areaBody:
        "نخدم أطباء الأسنان في القاهرة وأسيوط، مع إتاحة الشحن إلى بورسعيد.",
    },
  },
} as const;

export function whatsappUrl(locale: Locale) {
  const message =
    locale === "ar"
      ? "مرحباً مختبر إبداع للأسنان، أود إرسال حالة."
      : "Hello IBDAA Dental Lab, I would like to send a dental case.";
  return `https://wa.me/${business.primaryWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}

// TODO: Set NEXT_PUBLIC_SITE_URL to the verified production domain before launch.
export const siteOrigin = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return `${siteOrigin}${path}`;
}
