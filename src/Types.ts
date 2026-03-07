type PaperType = "journal" | "conference" | "thesis" | "book";
type PaperStatus = "published" | "preprint" | "under-review" | "accepted" | "workshop";
type Paper = Journal | Conference | Thesis | Book;

interface Author {
  family: string;
  given: string;
}

interface SocialLink {
  label: string;
  url: string;
  icon?: string;
}

interface Profile {
  name: string;
  title: string;
  affiliation: string;
  lab?: string;
  advisor?: string;
  advisorUrl?: string;
  email: string;
  location: string;
  office?: string;
  bio: string[];
  interests: string[];
  socials: SocialLink[];
  scholarUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  cvUrl?: string;
  profileImage?: string;
  mapEmbedUrl?: string;
  visitorMapUrl?: string;
  visitorMapImage?: string;
}

interface Publication {
  id: string;
  type: PaperType;
  author: Author[];
  title: string;
  year: number;
  DOI?: string;
  number?: string;
  pages?: string;
  month?: string;
  note?: string;
  venueShort?: string;
  award?: string;
  status?: PaperStatus;
  selected?: boolean;
  tags?: string[];
  summary?: string;
  abstract?: string;
  image?: string;

  site?: string;
  pdf?: string;
  preprint?: string;
  code?: string;
  slides?: string;
  video?: string;
  poster?: string;
  project?: string;
}

interface Journal extends Publication {
  type: "journal";
  journal: string;
  volume?: string;
}

interface Conference extends Publication {
  type: "conference";
  booktitle: string;
  editor?: string;
  volume?: string;
  serires?: string;
  chapter?: string;
  address?: string;
  edition?: string;
}

interface Thesis extends Publication {
  type: "thesis";
  school: string;
}

interface Book extends Publication {
  type: "book";
  publisher: string;
}

interface ServiceItem {
  title: string;
  venue: string;
  date: string;
}

interface ContractDate {
  month: string;
  year: number;
}

interface Work {
  title: string;
  affiliation: string;
  url?: string;
  city: string;
  country: string;
  begin: ContractDate;
  end?: ContractDate;
  summary?: string;
}

interface Teaching {
  title?: string;
  course: string;
  school?: string;
  date?: string;
}

interface Supervisor {
  name: string;
  homepage?: string;
  note?: string;
}

interface EducationItem {
  degree: string;
  department: string;
  school: string;
  schoolUrl?: string;
  period: string;
  thesis?: string;
  supervisor?: Supervisor[];
}

interface TimelineItem {
  date: string;
  title: string;
  affiliation: string;
  type: "education" | "work";
  city?: string;
  description?: string;
}

interface NewsItem {
  date: string;
  title: string;
  description?: string;
  link?: string;
}

interface ResearchLink {
  label: string;
  url: string;
}

interface ResearchItem {
  title: string;
  description: string;
  keywords?: string[];
  bullets?: string[];
  links?: ResearchLink[];
}

export type {
  PaperType,
  PaperStatus,
  Paper,
  Author,
  Publication,
  Journal,
  Conference,
  Thesis,
  Book,
  ServiceItem,
  ContractDate,
  Work,
  Teaching,
  EducationItem,
  TimelineItem,
  Profile,
  SocialLink,
  NewsItem,
  ResearchItem,
  ResearchLink,
};

// type PaperType = "journal" | "conference" | "thesis" | "book";
// type Paper = Journal | Conference | Thesis | Book;

// interface Author {
//   family: string;
//   given: string;
// }

// //https://en.wikipedia.org/wiki/BibTeX#Entry_types
// interface Publication {
//   id: string;
//   type: PaperType;
//   author: Author[];
//   title: string;
//   year: number;
//   DOI?: string;
//   number?: string;
//   pages?: string;
//   month?: string;
//   note?: string;

//   // Not in bibtex spec, but for the website
//   site?: string;
//   pdf?: string;
// }

// interface Journal extends Publication {
//   type: "journal";
//   journal: string;
//   volume: string;
// }

// interface Conference extends Publication {
//   type: "conference";
//   booktitle: string;
//   editor?: string;
//   volume?: string;
//   serires?: string;
//   chapter?: string;
//   address?: string;
//   edition?: string;
// }

// interface Thesis extends Publication {
//   type: "thesis";
//   school: string;
// }

// interface Book extends Publication {
//   type: "book";
//   publisher: string;
// }

// interface ServiceItem {
//   title: string;
//   venue: string;
//   date: string;
// }

// interface ContractDate {
//   month: string;
//   year: number;
// }

// interface Work {
//   title: string;
//   affiliation: string;
//   url?: string;
//   city: string;
//   country: string;
//   begin: ContractDate;
//   end?: ContractDate;
// }

// interface Teaching {
//   title: string;
//   course: string;
//   school: string;
//   date: string;
// }

// interface Supervisor {
//   name: string;
//   homepage?: string;
//   note?: string;
// }

// interface EducationItem {
//   degree: string;
//   department: string;
//   school: string;
//   schoolUrl: string;
//   period: string;
//   thesis?: string;
//   supervisor?: Supervisor[];
// }

// interface TimelineItem {
//   date: string;
//   title: string;
//   affiliation: string;
//   type: "education" | "work";
//   city?: string;
//   description?: string;
// }

// export type {
//   PaperType,
//   Paper,
//   Author,
//   Publication,
//   Journal,
//   Conference,
//   Thesis,
//   Book,
//   ServiceItem,
//   ContractDate,
//   Work,
//   Teaching,
//   EducationItem,
//   TimelineItem,
// };
