import type { AboutContent, ImageAsset } from "./types";

const portrait = (file: string, name: string): ImageAsset => ({
  src: `/people/${file}.webp`,
  alt: `Portrait of ${name}`,
  width: 480,
  height: 600,
});

const network = (file: string, name: string): ImageAsset => ({
  src: `/people/network/${file}.webp`,
  alt: `Portrait of ${name}`,
  width: 480,
  height: 600,
});

export const about: AboutContent = {
  meta: {
    title: "About Us",
    description:
      "Founded by Richa Singh, Axon Arbor brings together senior advisors, specialist facilitators and global assessment and speaker partners.",
    path: "/about",
  },

  header: {
    eyebrow: "About us",
    heading: "Always have your ear to the ground.",
    lede: "A founder with two decades inside complex organisations, senior HR leaders as advisors, and a network of specialists who have spent years honing their craft.",
  },

  founder: {
    eyebrow: "Founder’s story",
    heading: "Paying two decades of learning forward",
    paragraphs: [
      "More than 20 years of building learning initiatives across complex organisations revealed what drives performance, and what quietly limits it.",
      "Axon Arbor was founded to pay that learning forward: applying experience with intent to build capability, close performance gaps and deliver measurable impact on how people perform and how businesses grow.",
      "Richa’s journey through diverse industries and organisational contexts has given her a distinctive lens for spotting the hidden barriers to performance, and the untapped opportunities for growth.",
    ],
    name: "Richa Singh",
    role: "Founder, Axon Arbor",
    image: {
      src: "/people/richa.webp",
      alt: "Portrait of Richa Singh, founder of Axon Arbor",
      width: 640,
      height: 800,
    },
  },

  advisors: {
    eyebrow: "Our advisors",
    heading: "Counsel from the top of the profession",
    people: [
      {
        name: "Suresh Tripathi",
        bio: "With over 40 years of experience at Tata Steel, SRF, Air India, Sri Educare, SAIL, HCL Perot and Mascon Global, Suresh is a respected leader in the fraternity. He serves as an Independent Director on the boards of several companies and educational institutions.",
        image: portrait("suresh", "Suresh Tripathi"),
      },
      {
        name: "Shailesh Singh",
        bio: "A pre-eminent HR leader with 30 years of shaping world-class people agendas and organisational culture. He is Chief People Officer of Axis Max Life Insurance, and previously worked with GE Energy, GE Electric, GE Capital, SRF Finance, Eicher Tractors and the National Dairy Development Board, strengthening HR processes and strategy across India, Africa and the Middle East.",
        image: portrait("shailesh", "Shailesh Singh"),
      },
      {
        name: "Vikas Baijal",
        bio: "Over 36 years of HR experience across retail, consumer services, technology and hospitality, with exposure across the US, Europe, Asia and Africa; his last corporate role was CHRO for Bata’s India and South Asia operations. An ICF-PCC credentialed leadership and executive coach, Vikas works with CXOs, emerging leaders and high-potential talent on personal effectiveness, career transitions, strategic thinking and influence.",
        image: portrait("vikas", "Vikas Baijal"),
      },
    ],
  },

  facilitators: {
    eyebrow: "Our network of facilitators",
    heading: "Dedicated professionals driving your success",
    // Source: "Website Content Database of Trainers" sheet (Nov 2026). Public
    // fields only: no contact details, rates or availability.
    people: [
      {
        name: "Aditi Choudhary",
        role: "Leadership & Parenting Coaching",
        bio: "An ICF Associate Certified Coach with more than 12 years of experience, Aditi works on emotional intelligence, values alignment, work-life integration and confidence building. She has worked with Standard Chartered Bank, xMonks and The Teacher Foundation.",
        image: network("aditi-choudhary", "Aditi Choudhary"),
      },
      {
        name: "Alpa Kapadia",
        role: "",
        bio: "",
        image: network("alpa-kapadia", "Alpa Kapadia"),
      },
      {
        name: "Dr Archana Gupta",
        role: "Executive Coaching & Leadership Development",
        bio: "An ICF PCC coach, EMCC Senior Practitioner and Hogan assessor with 17+ years of experience in leadership development, executive presence and behavioural competencies. She has worked with the National Insurance Academy, CPWD, nationalised banks and BetterUp.",
        image: network("archana-gupta", "Dr Archana Gupta"),
      },
      {
        name: "Debarati Roy",
        role: "Executive Presence & Personal Branding",
        bio: "Debarati pairs 10+ years in luxury hospitality sales with 8+ years in training and coaching, covering executive presence, business etiquette and communication. A certified soft-skills trainer and NLP Master Practitioner, she has worked with Godrej Properties, Tanishq, MG Motors and Oberoi Hotels.",
        image: network("debarati-roy", "Debarati Roy"),
      },
      {
        name: "Deepali Sadavarte",
        role: "POSH and DEI",
        bio: "A Company Secretary and certified POSH and DEI trainer with 10+ years of experience in policy drafting, Internal Committee support and investigations. Clients include Veritas Technologies, Red Nucleus, Aarti Drugs and MIT College.",
        image: network("deepali-sadavarte", "Deepali Sadavarte"),
      },
      {
        name: "Dr Raina Khatri Tandon",
        role: "POSH, POCSO & Workplace Compliance",
        bio: "With 26+ years in POSH, POCSO, DEI and women’s and child rights, Raina advises on workplace compliance, leadership and empowerment. She has worked with Bank of America, ONGC, Tata Steel, Deloitte, L&T and Kotak Bank.",
        image: network("raina-khatri-tandon", "Dr Raina Khatri Tandon"),
      },
      {
        name: "Gourav Maharshi",
        role: "Corporate Finance & Financial Modelling",
        bio: "Having cleared CFA Level I, Gourav has 8+ years teaching corporate finance, equity research, valuation, derivatives, risk management and advanced Excel. He has trained for NSE Academy, ICAI, ICICI Group, IIFT New Delhi and IMT Nagpur.",
        image: network("gourav-maharshi", "Gourav Maharshi"),
      },
      {
        name: "Hemmangi Ohri",
        role: "Learning & Talent Development",
        bio: "A Certified Professional in Talent Development (ATD) based in Singapore, with 9+ years in strategic L&D, leadership development, succession planning and change. She has worked with the Dubai Health Authority, Dubai Municipality, Dubai Police and Al Khoory Hotels.",
      },
      {
        name: "Jyotirmoy Bose",
        role: "Leadership & Organisation Effectiveness",
        bio: "A Marshall Goldsmith certified executive coach with 30+ years in organisation development, systemic change and business transformation, including AI and data-led change. His career spans Ernst & Young, Arthur Andersen, The Times Group, ANZ Grindlays and Asian Paints.",
        image: network("jyotirmoy-bose", "Jyotirmoy Bose"),
      },
      {
        name: "Kavita Pasricha",
        role: "Executive Presence & Communication",
        bio: "With 20 years in leadership development, image consulting, business storytelling and public speaking, Kavita is a certified soft-skills trainer and L&OD Master Practitioner. Clients include Accenture, EY, Novartis, Genpact, MetLife and Wipro.",
      },
      {
        name: "Latha Sundaram Verghese",
        role: "Executive Coaching & Talent Assessment",
        bio: "Latha brings 29+ years in executive coaching, talent assessment, executive search and organisation development, and is certified in behavioural event interviewing, Enneagram and EQ-i 2.0. She has worked with ICICI Bank, Aviva Life Insurance, Genpact and GECIS.",
        image: network("latha-sundaram-verghese", "Latha Sundaram Verghese"),
      },
      {
        name: "Mahrukh Bandorawalla",
        role: "Executive Coaching",
        bio: "An ICF Master Certified Coach with 25+ years in HR and organisation development and 15+ years of coaching, accredited in Hogan, OPQ and team coaching. Clients include Siemens, TCS, Citibank, Flipkart, P&G, J&J and Tata Motors.",
        image: network("mahrukh-bandorawalla", "Mahrukh Bandorawalla"),
      },
      {
        name: "Malati Vasudeva",
        role: "Psychometric Assessments & Talent Management",
        bio: "Malati has 30 years in leadership development, executive coaching, 360-degree feedback and HR leadership. She is certified in MBTI, CCL Benchmarks 360 and the Workplace Big Five, with experience at Sun Pharmaceutical and Pipal Software.",
        image: network("malati-vasudeva", "Malati Vasudeva"),
      },
      {
        name: "Mandeep Merwah",
        role: "Women in Leadership & Executive Presence",
        bio: "A RogenSi certified facilitator with 14+ years in women’s leadership, emotional intelligence, storytelling, DEI and first-time manager development. Clients include EY, Airbus, PwC, Vodafone, SAP, Reliance Jio and Tata Power.",
        image: network("mandeep-merwah", "Mandeep Merwah"),
      },
      {
        name: "Monica Alex",
        role: "L&D Strategy & Capability Building",
        bio: "Monica has 34 years in learning and development strategy, talent development, HR analytics, instructional design and train-the-trainer, with certifications in coaching, OD and psychometrics. She has worked with Landmark Group, Tesco, Himalaya and TimesPro.",
        image: network("monica-alex", "Monica Alex"),
      },
      {
        name: "Nivedita Rath",
        role: "Executive & Team Coaching",
        bio: "Based in London, Nivedita is an EMCC Senior Practitioner with 30+ years in leadership, change and inclusion, and an IIM Bangalore MBA. Her experience spans Worldpay, Lloyds Banking Group, RBS and HSBC Global Banking and Markets.",
        image: network("nivedita-rath", "Nivedita Rath"),
      },
      {
        name: "Pooja Sahitya",
        role: "Leadership & Psychological Safety",
        bio: "Pooja brings 15+ years of leadership training and executive coaching grounded in counselling psychology, transactional analysis and experiential group work. Clients include IndiGo, General Mills, Motilal Oswal, R1 RCM and eClerx.",
        image: network("pooja-sahitya", "Pooja Sahitya"),
      },
      {
        name: "R. SreeKumar",
        role: "Strengths-Based & Executive Coaching",
        bio: "A Gallup certified strengths coach, ICTA certified NLP trainer and Enneagram master coach with 27 years in leadership development, appreciative inquiry and storytelling. Clients include Airbus, American Express, Biocon Biologics, Deutsche Bank and Axis Max Life.",
        image: network("sreekumar", "R. SreeKumar"),
      },
      {
        name: "Rajeev Malik",
        role: "Brand Strategy & Sales Leadership",
        bio: "Rajeev has 35+ years in brand strategy, marketing, sales and executive education, with programmes from Michigan Ross, Toyota and IIM Ahmedabad. He has worked with the Mahindra Group, Toyota, Tata AutoComp, Blue Star, Eureka Forbes and Xerox.",
        image: network("rajeev-malik", "Rajeev Malik"),
      },
      {
        name: "Rajneesh Mathur",
        role: "L&D Strategy & Leadership Pipeline",
        bio: "An ICF Associate Certified Coach with 30+ years in L&D strategy, competency assessment, sales effectiveness and leadership pipeline development, including an OD certificate from TISS. He previously led learning and development at Max.",
        image: network("rajneesh-mathur", "Rajneesh Mathur"),
      },
      {
        name: "Rashmi Shetty",
        role: "Voice, Communication & Executive Presence",
        bio: "An ICF PCC coach with 30+ years in voice and communication coaching, public speaking, presentation skills and leadership communication. Her work includes All India Radio, 101.3 FM Rainbow and Hotel Ashok (ITDC).",
        image: network("rashmi-shetty", "Rashmi Shetty"),
      },
      {
        name: "Rekha Radhakrishnan",
        role: "Executive Coaching & Supervision",
        bio: "An ICF PCC coach with EMCC accreditation in coaching and supervision, Rekha has 20+ years in executive, Gestalt and somatic coaching, DEI&B and career transitions. She coaches with BetterUp, GrowthSpace and Torch, and has worked with Accenture Consulting.",
        image: network("rekha-radhakrishnan", "Rekha Radhakrishnan"),
      },
      {
        name: "Ripudaman Singh Sujlana",
        role: "Hospitality & Service Excellence",
        bio: "Trained at IHM Bangalore, Ripudaman has 29+ years in hospitality, customer service and leadership coaching. His experience spans Oberoi Hotels & Resorts, McDonald’s, IBM and IBM Daksh.",
        image: network("ripudaman-singh-sujlana", "Ripudaman Singh Sujlana"),
      },
      {
        name: "Rubal Sabharwal",
        role: "AI Strategy & Business Transformation",
        bio: "A former BCG practice lead with 20+ years in AI strategy, agentic architecture, GenAI practice building, operating-model redesign and go-to-market. Certified by Harvard Business School, INSEAD and IBM, she has worked with Tata and Tech Mahindra.",
        image: network("rubal-sabharwal", "Rubal Sabharwal"),
      },
      {
        name: "Satadru Chakraborty",
        role: "Enterprise HR & Organisation Design",
        bio: "Satadru has 20+ years in enterprise HR, organisation design, workforce strategy and executive coaching, and is Belbin Team Role accredited. His experience spans WatchGuard Technologies, Progress Software, CGI, Signify and Schneider Electric.",
        image: network("satadru-chakraborty", "Satadru Chakraborty"),
      },
      {
        name: "Sneha Venkataram",
        role: "Executive, Team & Systems Coaching",
        bio: "A Certified Professional Co-Active Coach and ICF ACC with ORSC and Leadership Circle Profile certifications, Sneha has 20+ years in coaching, OD and global HR business partnering. She has worked with HPE, Titan, Emerson and National Instruments.",
        image: network("sneha-venkataram", "Sneha Venkataram"),
      },
      {
        name: "Supriiya Patil",
        role: "Experiential Learning & Team Building",
        bio: "A former Indian Army captain with 18+ years in behavioural training, experiential and outdoor learning, conflict resolution and train-the-trainer. A DISC certified facilitator, she has worked with TVS Motors, Wipro, BYJU’S and LifeCell.",
        image: network("supriiya-patil", "Supriiya Patil"),
      },
      {
        name: "Swati Adhikary",
        role: "Design Thinking & Innovation",
        bio: "Swati has over two decades in HR leadership and is an MIT-trained Design Thinking specialist working on innovation, strategy and culture transformation. Clients include Decathlon, Lilly, Nestlé, Tata Motors, Axis Max Life, YES Bank and L&T.",
        image: network("swati-adhikary", "Swati Adhikary"),
      },
      {
        name: "Tamanna Khurana",
        role: "Experiential Learning Design & Facilitation",
        bio: "Tamanna has 13+ years designing experiential learning on structured problem solving, emotional agility, storytelling and change. She has worked with EY, BCG, PwC and KPMG.",
        image: network("tamanna-khurana", "Tamanna Khurana"),
      },
      {
        name: "Vikram Nandwani",
        role: "Communications & HR Branding",
        bio: "Vikram works at the intersection of transformation, communication and visual thinking. A Lean Six Sigma Master Black Belt with 25+ years of experience, he uses visual storytelling for employer branding and change. Clients include Infosys BPM, Bajaj Finserv, Axis Max Life, Mphasis and Medline India.",
        image: network("vikram-nandwani", "Vikram Nandwani"),
      },
      {
        name: "Vipul Jain",
        role: "Gen AI",
        bio: "Vipul has 14+ years in Generative AI, AI tools and agents, HR tech and learning journey design, and is a three-time published author. He runs Gen AI workshops for Hindalco, CRISIL, John Deere, L&T, Tata Motors, IHCL and Wipro.",
        image: network("vipul-jain", "Vipul Jain"),
      },
      {
        name: "Yogambika Kumaraguru",
        role: "Communication & Leadership",
        bio: "With 20+ years in corporate banking and 10+ in training, Yogambika covers communication, public speaking, stakeholder management and campus-to-corporate transitions. She has worked with Axis Bank, Kotak Mahindra Bank and HSBC.",
        image: network("yogambika-kumaraguru", "Yogambika Kumaraguru"),
      },
    ],
  },

  partners: {
    eyebrow: "Our partners",
    heading: "Global tools and voices, locally delivered",
    items: [
      {
        kind: "Assessment partner",
        name: "Strengthscape",
        paragraphs: [
          "Applied to learning, assessments provide feedback and insight that improve both job performance and the way we teach.",
          "Strengthscape has worked with leading brands including Aditya Birla, Adani, Amazon, Dell, Glenmark, Citi, EY and Tata Power, and is the official India partner for:",
        ],
        list: [
          "The Five Behaviors of a Cohesive Team assessment",
          "Evalax Solutions: leadership assessment tools, 360 assessments and culture surveys",
          "Everything DiSC: Workplace, For Leaders, For Sales and Agile EQ",
        ],
        logo: {
          src: "/partners/strengthscape.png",
          alt: "Strengthscape",
          width: 637,
          height: 187,
        },
      },
      {
        kind: "Speakers partner",
        name: "London Speaker Bureau India",
        paragraphs: [
          "London Speaker Bureau is a curated global network of leading CEOs, board members, authors, economists, sportspeople, celebrities, subject-matter experts and thought leaders. Together we curate speaker engagements aligned with your strategic learning and business objectives.",
          "Its focus areas include keynote speakers, executive masterclasses, boardroom advisory and brand collaborations.",
        ],
        stats: [
          { value: "45,000+", label: "engagements delivered" },
          { value: "10,000+", label: "organisations worldwide" },
        ],
        logo: {
          src: "/partners/london-speakers-bureau.webp",
          alt: "London Speaker Bureau India",
          width: 600,
          height: 600,
        },
      },
    ],
  },

  cta: {
    heading: "Meet the people behind the work.",
    body: "Tell us what you’re trying to change. We’ll match the right specialists to your brief.",
    cta: { label: "Schedule a Consultation", href: "/contact" },
  },
};
