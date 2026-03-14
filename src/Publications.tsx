import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Collapse,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faChevronDown,
  faChevronUp,
  faClipboard,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import App from "./App";
import { generateBibtex, getTypeLabel, getVenue, getVenueShort } from "./Paper";
import { Paper, PaperType } from "./Types";
import { loadYamlFile } from "./data";
import PublicationChat from "./PublicationChat";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";

type FilterType = "all" | PaperType | "preprint" | "selected";

function LinkChip(props: { href: string; label: string }) {
  return (
    <a className="link-chip" href={props.href} target="_blank" rel="noreferrer">
      {props.label}
    </a>
  );
}

function isPdfFile(path?: string) {
  return typeof path === "string" && path.toLowerCase().endsWith(".pdf");
}

function isPreprintPaper(paper: Paper) {
  return paper.status === "preprint";
}

function groupByYear(items: Paper[]) {
  const grouped: { [year: string]: Paper[] } = Object.create(null);

  items.forEach((item) => {
    const yearKey = String(item.year);
    grouped[yearKey] = grouped[yearKey] || [];
    grouped[yearKey].push(item);
  });

  return grouped;
}

function BibtexModal(props: {
  show: boolean;
  onHide: () => void;
  paper?: Paper;
}) {
  const [copied, setCopied] = useState(false);

  if (!props.paper) {
    return null;
  }

  const bibtex = generateBibtex(props.paper);

  return (
    <Modal show={props.show} onHide={props.onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>BibTeX</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <pre className="bibtex-block">{bibtex}</pre>
      </Modal.Body>
      <Modal.Footer>
        <Button
          active={copied}
          onClick={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            navigator.clipboard.writeText(bibtex);
          }}
        >
          <FontAwesomeIcon icon={faClipboard} /> {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="outline-secondary" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function renderAuthors(authors: Paper["author"]): ReactNode {
  return authors.map((author, index) => {
    const fullName = `${author.given} ${author.family}`;
    const isUser = fullName.toLowerCase() === "zuyuan zhang";
    const suffix =
      index === authors.length - 1
        ? ""
        : index === authors.length - 2
        ? ", and "
        : ", ";

    return (
      <span key={`${author.family}-${author.given}-${index}`}>
        {isUser ? <strong>{fullName}</strong> : fullName}
        {suffix}
      </span>
    );
  });
}

function statusVariant(status?: string) {
  switch (status) {
    case "preprint":
      return "warning";
    case "accepted":
      return "success";
    case "under-review":
      return "secondary";
    default:
      return "dark";
  }
}

function MarkdownMath(props: { content: string; className?: string }) {
  return (
    <div className={props.className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm as any, remarkMath as any]}
        rehypePlugins={[rehypeKatex as any]}
      >
        {props.content}
      </ReactMarkdown>
    </div>
  );
}

function PublicationCard(props: {
  paper: Paper;
  onBibtex: (paper: Paper) => void;
}) {
  const { paper, onBibtex } = props;
  const [expanded, setExpanded] = useState(false);
  // 加入LLM
  const [chatOpen, setChatOpen] = useState(false);
  const hasPreview = Boolean(paper.summary || paper.abstract || paper.image);

  return (
    <Card className="paper-card border-0 shadow-sm">
      <Card.Body>
        <div className="paper-header-row">
          <div>
            <div className="badge-row mb-2">
              <Badge bg="primary-subtle" text="primary" pill>
                {getTypeLabel(paper)}
              </Badge>

              {paper.status && (
                <Badge bg={statusVariant(paper.status)} pill>
                  {paper.status}
                </Badge>
              )}

              {paper.selected && (
                <Badge bg="success" pill>
                  selected
                </Badge>
              )}

              {paper.award && (
                <Badge bg="info" pill>
                  {paper.award}
                </Badge>
              )}
            </div>

            <h3 className="paper-title">{paper.title}</h3>
            <div className="paper-authors">{renderAuthors(paper.author)}</div>

            <div className="paper-venue">
              <strong>{getVenueShort(paper)}</strong>
              {getVenueShort(paper) !== getVenue(paper) && (
                <span> · {getVenue(paper)}</span>
              )}
              <span> · {paper.year}</span>
              {paper.note && <span> · {paper.note}</span>}
            </div>
          </div>
        </div>

        {paper.tags && paper.tags.length > 0 && (
          <div className="tag-group mt-3">
            {paper.tags.map((tag) => (
              <span className="tag-pill tag-pill-light" key={`${paper.id}-${tag}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="link-row">
          {paper.preprint && (
            <LinkChip
              href={paper.preprint}
              label={paper.preprint.includes("arxiv.org") ? "arXiv" : "Preprint"}
            />
          )}
          {paper.pdf && <LinkChip href={paper.pdf} label="PDF" />}
          {paper.site && <LinkChip href={paper.site} label="Publisher" />}
          {paper.project && <LinkChip href={paper.project} label="Project" />}
          {paper.code && <LinkChip href={paper.code} label="Code" />}
          {paper.slides && <LinkChip href={paper.slides} label="Slides" />}
          {paper.poster && <LinkChip href={paper.poster} label="Poster" />}
          {paper.video && <LinkChip href={paper.video} label="Video" />}
          {paper.DOI && <LinkChip href={`https://doi.org/${paper.DOI}`} label="DOI" />}

          <button className="link-chip button-like" onClick={() => onBibtex(paper)}>
            BibTeX
          </button>

          {hasPreview && (
            <button
              className="link-chip button-like"
              onClick={() => setExpanded((value) => !value)}
            >
              Preview <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
            </button>
          )}
          {/* LLM 组件 */}
          <button
            className="link-chip button-like"
            onClick={() => setChatOpen((value) => !value)}
          >
            Chat use LLM <FontAwesomeIcon icon={chatOpen ? faChevronUp : faChevronDown} />
          </button>
        </div>

        {hasPreview && (
          <Collapse in={expanded}>
            <div className="preview-panel">
              <Row className="g-3 align-items-center">
                {paper.image && (
                  <Col md={paper.abstract || paper.summary ? 4 : 12}>
                    {isPdfFile(paper.image) ? (
                      <object
                        data={`${process.env.PUBLIC_URL}${paper.image}#toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        className="paper-preview-pdf"
                        aria-label={`${paper.title} teaser`}
                      >
                        <a
                          href={`${process.env.PUBLIC_URL}${paper.image}`}
                          target="_blank"
                          rel="noreferrer"
                          className="link-chip"
                        >
                          Open teaser PDF
                        </a>
                      </object>
                    ) : (
                      <img
                        src={`${process.env.PUBLIC_URL}${paper.image}`}
                        alt={`${paper.title} preview`}
                        className="paper-preview-image"
                      />
                    )}
                  </Col>
                )}

                {(paper.summary || paper.abstract) && (
                  <Col md={paper.image ? 8 : 12}>
                    {paper.summary && (
                      <div className="preview-block">
                        <div className="preview-label">Summary</div>
                        <MarkdownMath
                          content={paper.summary}
                          className="markdown-math-content"
                        />
                      </div>
                    )}

                    {paper.abstract && (
                      <div className="preview-block mt-3">
                        <div className="preview-label">Abstract</div>
                        <MarkdownMath
                          content={paper.abstract}
                          className="markdown-math-content"
                        />
                      </div>
                    )}
                  </Col>
                )}
              </Row>
            </div>
          </Collapse>
        )}
        {/* LLM 组件 */}
        <Collapse in={chatOpen}>
          <div className="preview-panel">
            <div className="preview-label">Ask about this paper</div>
            <PublicationChat paper={paper} />
          </div>
        </Collapse>
        
      </Card.Body>
    </Card>
  );
}

function SectionBlock(props: {
  title: string;
  perYear: { [year: string]: Paper[] };
  years: string[];
  onBibtex: (paper: Paper) => void;
}) {
  const { title, perYear, years, onBibtex } = props;

  if (years.length === 0) {
    return null;
  }

  return (
    <section className="section-card mb-4">
      <div className="section-title">{title}</div>

      {years.map((year) => (
        <section className="year-block" key={`${title}-${year}`}>
          <h2 className="year-heading">{year}</h2>
          <div className="stack-list">
            {perYear[year].map((paper) => (
              <PublicationCard key={paper.id} paper={paper} onBibtex={onBibtex} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function Publications() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [modalPaper, setModalPaper] = useState<Paper>();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadYamlFile<any>("/data/publications.yaml").then((data) => {
      const normalizedPapers: Paper[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.publications)
        ? data.publications
        : Array.isArray(data?.papers)
        ? data.papers
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.default)
        ? data.default
        : [];

      const sorted = [...normalizedPapers].sort((a, b) => b.year - a.year);

      console.log("publications raw data =", data);
      console.log("publications normalized =", normalizedPapers);

      setPapers(sorted);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return papers.filter((paper) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "preprint"
          ? isPreprintPaper(paper)
          : filter === "selected"
          ? Boolean(paper.selected)
          : paper.type === filter;

      const haystack = [
        paper.title,
        paper.abstract,
        paper.summary,
        getVenue(paper),
        paper.tags?.join(" "),
        paper.author.map((item) => `${item.given} ${item.family}`).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && haystack.includes(query.trim().toLowerCase());
    });
  }, [filter, papers, query]);

  const publicationPapers = useMemo(
    () => filtered.filter((paper) => !isPreprintPaper(paper)),
    [filtered]
  );

  const preprintPapers = useMemo(
    () => filtered.filter((paper) => isPreprintPaper(paper)),
    [filtered]
  );

  const publicationPerYear = useMemo(
    () => groupByYear(publicationPapers),
    [publicationPapers]
  );

  const preprintPerYear = useMemo(
    () => groupByYear(preprintPapers),
    [preprintPapers]
  );

  const publicationYears = useMemo(
    () =>
      Object.keys(publicationPerYear).sort(
        (a, b) => parseInt(b, 10) - parseInt(a, 10)
      ),
    [publicationPerYear]
  );

  const preprintYears = useMemo(
    () =>
      Object.keys(preprintPerYear).sort(
        (a, b) => parseInt(b, 10) - parseInt(a, 10)
      ),
    [preprintPerYear]
  );

  const handleBibtex = (paper: Paper) => {
    setModalPaper(paper);
    setShowModal(true);
  };

  return (
    <App>
      <section className="page-header-block">
        <div className="section-title">
          <FontAwesomeIcon icon={faBookOpen} /> Publications
        </div>
        <p className="text-muted mb-0">
          Filter by publication type, search by keyword, and optionally expand a paper card to show
          an abstract, visual preview, or short explanation.
        </p>
      </section>

      <section className="section-card page-block">
        <Row className="g-3 align-items-center">
          <Col lg={6}>
            <Form.Group>
              <Form.Label>Search papers</Form.Label>
              <div className="search-box">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <Form.Control
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="title, venue, author, keyword..."
                />
              </div>
            </Form.Group>
          </Col>

          <Col lg={6}>
            <Form.Label>Quick filters</Form.Label>
            <div>
              <ButtonGroup className="filter-group flex-wrap">
                <Button
                  variant={filter === "all" ? "dark" : "outline-dark"}
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "journal" ? "dark" : "outline-dark"}
                  onClick={() => setFilter("journal")}
                >
                  Journal
                </Button>
                <Button
                  variant={filter === "conference" ? "dark" : "outline-dark"}
                  onClick={() => setFilter("conference")}
                >
                  Conference
                </Button>
                <Button
                  variant={filter === "preprint" ? "dark" : "outline-dark"}
                  onClick={() => setFilter("preprint")}
                >
                  Preprint
                </Button>
                <Button
                  variant={filter === "selected" ? "dark" : "outline-dark"}
                  onClick={() => setFilter("selected")}
                >
                  Selected
                </Button>
              </ButtonGroup>
            </div>
          </Col>
        </Row>
      </section>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <div className="page-block">
          {publicationYears.length === 0 && preprintYears.length === 0 ? (
            <section className="section-card">No papers match the current filter.</section>
          ) : (
            <>
              <SectionBlock
                title="Publications"
                perYear={publicationPerYear}
                years={publicationYears}
                onBibtex={handleBibtex}
              />

              <SectionBlock
                title="Preprints"
                perYear={preprintPerYear}
                years={preprintYears}
                onBibtex={handleBibtex}
              />
            </>
          )}
        </div>
      )}

      <BibtexModal
        show={showModal}
        onHide={() => setShowModal(false)}
        paper={modalPaper}
      />
    </App>
  );
}

export default Publications;

// import { ReactNode, useEffect, useMemo, useState } from "react";
// import {
//   Badge,
//   Button,
//   ButtonGroup,
//   Card,
//   Col,
//   Collapse,
//   Form,
//   Modal,
//   Row,
//   Spinner,
// } from "react-bootstrap";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBookOpen,
//   faChevronDown,
//   faChevronUp,
//   faClipboard,
//   faMagnifyingGlass,
// } from "@fortawesome/free-solid-svg-icons";
// import App from "./App";
// import { generateBibtex, getTypeLabel, getVenue, getVenueShort } from "./Paper";
// import { Paper, PaperType } from "./Types";
// import { loadYamlFile } from "./data";
// import PdfPreview from "./PdfPreview";

// import ReactMarkdown from "react-markdown";
// import remarkMath from "remark-math";
// import rehypeKatex from "rehype-katex";
// import remarkGfm from "remark-gfm";

// type FilterType = "all" | PaperType | "preprint" | "selected";

// function LinkChip(props: { href: string; label: string }) {
//   return (
//     <a className="link-chip" href={props.href} target="_blank" rel="noreferrer">
//       {props.label}
//     </a>
//   );
// }


// function isPdfFile(path?: string) {
//   return typeof path === "string" && path.toLowerCase().endsWith(".pdf");
// }

// function BibtexModal(props: {
//   show: boolean;
//   onHide: () => void;
//   paper?: Paper;
// }) {
//   const [copied, setCopied] = useState(false);

//   if (!props.paper) {
//     return null;
//   }

//   const bibtex = generateBibtex(props.paper);

//   return (
//     <Modal show={props.show} onHide={props.onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>BibTeX</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <pre className="bibtex-block">{bibtex}</pre>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button
//           active={copied}
//           onClick={() => {
//             setCopied(true);
//             setTimeout(() => setCopied(false), 2000);
//             navigator.clipboard.writeText(bibtex);
//           }}
//         >
//           <FontAwesomeIcon icon={faClipboard} /> {copied ? "Copied" : "Copy"}
//         </Button>
//         <Button variant="outline-secondary" onClick={props.onHide}>
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

// function renderAuthors(authors: Paper["author"]): ReactNode {
//   return authors.map((author, index) => {
//     const fullName = `${author.given} ${author.family}`;
//     const isUser = fullName.toLowerCase() === "zuyuan zhang";
//     const suffix =
//       index === authors.length - 1
//         ? ""
//         : index === authors.length - 2
//         ? ", and "
//         : ", ";

//     return (
//       <span key={`${author.family}-${author.given}-${index}`}>
//         {isUser ? <strong>{fullName}</strong> : fullName}
//         {suffix}
//       </span>
//     );
//   });
// }

// function statusVariant(status?: string) {
//   switch (status) {
//     case "preprint":
//       return "warning";
//     case "accepted":
//       return "success";
//     case "under-review":
//       return "secondary";
//     default:
//       return "dark";
//   }
// }

// function isPreprintPaper(paper: Paper) {
//   return paper.status === "preprint";
// }

// function MarkdownMath(props: { content: string; className?: string }) {
//   return (
//     <div className={props.className}>
//       <ReactMarkdown
//         remarkPlugins={[remarkGfm as any, remarkMath as any]}
//         rehypePlugins={[rehypeKatex as any]}
//       >
//         {props.content}
//       </ReactMarkdown>
//     </div>
//   );
// }
// // function MarkdownMath(props: { content: string; className?: string }) {
// //   return (
// //     <div className={props.className}>
// //       <ReactMarkdown
// //         remarkPlugins={[remarkGfm, remarkMath]}
// //         rehypePlugins={[rehypeKatex]}
// //       >
// //         {props.content}
// //       </ReactMarkdown>
// //     </div>
// //   );
// // }

// function PublicationCard(props: {
//   paper: Paper;
//   onBibtex: (paper: Paper) => void;
// }) {
//   const { paper, onBibtex } = props;
//   const [expanded, setExpanded] = useState(false);
//   const hasPreview = Boolean(paper.summary || paper.abstract || paper.image);

//   return (
//     <Card className="paper-card border-0 shadow-sm">
//       <Card.Body>
//         <div className="paper-header-row">
//           <div>
//             <div className="badge-row mb-2">
//               <Badge bg="primary-subtle" text="primary" pill>
//                 {getTypeLabel(paper)}
//               </Badge>
//               {paper.status && (
//                 <Badge bg={statusVariant(paper.status)} pill>
//                   {paper.status}
//                 </Badge>
//               )}
//               {paper.selected && (
//                 <Badge bg="success" pill>
//                   selected
//                 </Badge>
//               )}
//               {paper.award && (
//                 <Badge bg="info" pill>
//                   {paper.award}
//                 </Badge>
//               )}
//             </div>

//             <h3 className="paper-title">{paper.title}</h3>
//             <div className="paper-authors">{renderAuthors(paper.author)}</div>
//             <div className="paper-venue">
//               <strong>{getVenueShort(paper)}</strong>
//               {getVenueShort(paper) !== getVenue(paper) && (
//                 <span> · {getVenue(paper)}</span>
//               )}
//               <span> · {paper.year}</span>
//               {paper.note && <span> · {paper.note}</span>}
//             </div>
//           </div>
//         </div>

//         {paper.tags && paper.tags.length > 0 && (
//           <div className="tag-group mt-3">
//             {paper.tags.map((tag) => (
//               <span className="tag-pill tag-pill-light" key={`${paper.id}-${tag}`}>
//                 {tag}
//               </span>
//             ))}
//           </div>
//         )}

//         <div className="link-row">
//           {paper.preprint && <LinkChip href={paper.preprint} label="Preprint" />}
//           {paper.pdf && <LinkChip href={paper.pdf} label="PDF" />}
//           {paper.site && <LinkChip href={paper.site} label="Publisher" />}
//           {paper.project && <LinkChip href={paper.project} label="Project" />}
//           {paper.code && <LinkChip href={paper.code} label="Code" />}
//           {paper.slides && <LinkChip href={paper.slides} label="Slides" />}
//           {paper.poster && <LinkChip href={paper.poster} label="Poster" />}
//           {paper.video && <LinkChip href={paper.video} label="Video" />}
//           {paper.DOI && <LinkChip href={`https://doi.org/${paper.DOI}`} label="DOI" />}
//           <button className="link-chip button-like" onClick={() => onBibtex(paper)}>
//             BibTeX
//           </button>
//           {hasPreview && (
//             <button
//               className="link-chip button-like"
//               onClick={() => setExpanded((value) => !value)}
//             >
//               Preview <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
//             </button>
//           )}
//         </div>

//         {hasPreview && (
//           <Collapse in={expanded}>
//             <div className="preview-panel">
//               <Row className="g-3 align-items-center">
//                 {/* {paper.image && (
//                   <Col md={paper.abstract || paper.summary ? 4 : 12}>
//                     <img
//                       src={paper.image}
//                       alt={`${paper.title} preview`}
//                       className="paper-preview-image"
//                     />
//                   </Col>
//                 )} */}
//                 {paper.image && (
//                   <Col md={paper.abstract || paper.summary ? 4 : 12}>
//                     {isPdfFile(paper.image) ? (
//                       <object
//                         data={`${process.env.PUBLIC_URL}${paper.image}#toolbar=0&navpanes=0&scrollbar=0`}
//                         type="application/pdf"
//                         className="paper-preview-pdf"
//                         aria-label={`${paper.title} teaser`}
//                       >
//                         <a
//                           href={`${process.env.PUBLIC_URL}${paper.image}`}
//                           target="_blank"
//                           rel="noreferrer"
//                           className="link-chip"
//                         >
//                           Open teaser PDF
//                         </a>
//                       </object>
//                     ) : (
//                       <img
//                         src={`${process.env.PUBLIC_URL}${paper.image}`}
//                         alt={`${paper.title} preview`}
//                         className="paper-preview-image"
//                       />
//                     )}
//                   </Col>
//                 )}
//                 {(paper.summary || paper.abstract) && (
//                   <Col md={paper.image ? 8 : 12}>
//                     {/* {paper.summary && (
//                       <div className="preview-block">
//                         <div className="preview-label">Summary</div>
//                         <p className="mb-0">{paper.summary}</p>
//                       </div>
//                     )}
//                     {paper.abstract && (
//                       <div className="preview-block mt-3">
//                         <div className="preview-label">Abstract</div>
//                         <p className="mb-0">{paper.abstract}</p>
//                       </div>
//                     )} */}
//                     {paper.summary && (
//                       <div className="preview-block">
//                         <div className="preview-label">Summary</div>
//                         <MarkdownMath content={paper.summary} className="markdown-math-content" />
//                       </div>
//                     )}
//                     {paper.abstract && (
//                       <div className="preview-block mt-3">
//                         <div className="preview-label">Abstract</div>
//                         <MarkdownMath content={paper.abstract} className="markdown-math-content" />
//                       </div>
//                     )}
//                   </Col>
//                 )}
                
//               </Row>
//             </div>
//           </Collapse>
//         )}
//       </Card.Body>
//     </Card>
//   );
// }

// function Publications() {
//   const [papers, setPapers] = useState<Paper[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState<FilterType>("all");
//   const [modalPaper, setModalPaper] = useState<Paper>();
//   const [showModal, setShowModal] = useState(false);

//   useEffect(() => {
//     loadYamlFile<any>("/data/publications.yaml").then((data) => {
//       const normalizedPapers: Paper[] = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.publications)
//         ? data.publications
//         : Array.isArray(data?.papers)
//         ? data.papers
//         : Array.isArray(data?.items)
//         ? data.items
//         : Array.isArray(data?.default)
//         ? data.default
//         : [];

//       const sorted = [...normalizedPapers].sort((a, b) => b.year - a.year);

//       console.log("publications raw data =", data);
//       console.log("publications normalized =", normalizedPapers);

//       setPapers(sorted);
//       setLoading(false);
//     });
//   }, []);

//   const filtered = useMemo(() => {
//     return papers.filter((paper) => {
//       const matchesFilter =
//         filter === "all"
//           ? true
//           : filter === "preprint"
//           ? paper.status === "preprint" || Boolean(paper.preprint)
//           : filter === "selected"
//           ? Boolean(paper.selected)
//           : paper.type === filter;

//       const haystack = [
//         paper.title,
//         paper.abstract,
//         paper.summary,
//         getVenue(paper),
//         paper.tags?.join(" "),
//         paper.author.map((item) => `${item.given} ${item.family}`).join(" "),
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return matchesFilter && haystack.includes(query.trim().toLowerCase());
//     });
//   }, [filter, papers, query]);

//   const perYear: { [year: string]: Paper[] } = filtered.reduce((result, item) => {
//     result[item.year] = result[item.year] || [];
//     result[item.year].push(item);
//     return result;
//   }, Object.create(null));

//   const years = Object.keys(perYear).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

//   return (
//     <App>
//       <section className="page-header-block">
//         <div className="section-title">
//           <FontAwesomeIcon icon={faBookOpen} /> Publications
//         </div>
//         <p className="text-muted mb-0">
//           Filter by publication type, search by keyword, and optionally expand a paper card to show
//           an abstract, visual preview, or short explanation.
//         </p>
//       </section>

//       <section className="section-card page-block">
//         <Row className="g-3 align-items-center">
//           <Col lg={6}>
//             <Form.Group>
//               <Form.Label>Search papers</Form.Label>
//               <div className="search-box">
//                 <FontAwesomeIcon icon={faMagnifyingGlass} />
//                 <Form.Control
//                   value={query}
//                   onChange={(event) => setQuery(event.target.value)}
//                   placeholder="title, venue, author, keyword..."
//                 />
//               </div>
//             </Form.Group>
//           </Col>
//           <Col lg={6}>
//             <Form.Label>Quick filters</Form.Label>
//             <div>
//               <ButtonGroup className="filter-group flex-wrap">
//                 <Button variant={filter === "all" ? "dark" : "outline-dark"} onClick={() => setFilter("all")}>All</Button>
//                 <Button variant={filter === "journal" ? "dark" : "outline-dark"} onClick={() => setFilter("journal")}>Journal</Button>
//                 <Button variant={filter === "conference" ? "dark" : "outline-dark"} onClick={() => setFilter("conference")}>Conference</Button>
//                 <Button variant={filter === "preprint" ? "dark" : "outline-dark"} onClick={() => setFilter("preprint")}>Preprint</Button>
//                 <Button variant={filter === "selected" ? "dark" : "outline-dark"} onClick={() => setFilter("selected")}>Selected</Button>
//               </ButtonGroup>
//             </div>
//           </Col>
//         </Row>
//       </section>

//       {loading ? (
//         <Spinner animation="border" />
//       ) : (
//         <div className="page-block">
//           {years.length === 0 ? (
//             <section className="section-card">No papers match the current filter.</section>
//           ) : (
//             years.map((year) => (
//               <section className="year-block" key={year}>
//                 <h2 className="year-heading">{year}</h2>
//                 <div className="stack-list">
//                   {perYear[year].map((paper) => (
//                     <PublicationCard
//                       key={paper.id}
//                       paper={paper}
//                       onBibtex={(item) => {
//                         setModalPaper(item);
//                         setShowModal(true);
//                       }}
//                     />
//                   ))}
//                 </div>
//               </section>
//             ))
//           )}
//         </div>
//       )}

//       <BibtexModal
//         show={showModal}
//         onHide={() => setShowModal(false)}
//         paper={modalPaper}
//       />
//     </App>
//   );
// }

// export default Publications;








// import { ReactNode, useEffect, useMemo, useState } from "react";
// import {
//   Badge,
//   Button,
//   ButtonGroup,
//   Card,
//   Col,
//   Collapse,
//   Form,
//   Modal,
//   Row,
//   Spinner,
// } from "react-bootstrap";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBookOpen,
//   faChevronDown,
//   faChevronUp,
//   faClipboard,
//   faMagnifyingGlass,
// } from "@fortawesome/free-solid-svg-icons";
// import App from "./App";
// import { generateBibtex, getTypeLabel, getVenue, getVenueShort } from "./Paper";
// import { Paper, PaperType } from "./Types";
// import { loadYamlFile } from "./data";

// type FilterType = "all" | PaperType | "preprint" | "selected";

// function LinkChip(props: { href: string; label: string }) {
//   return (
//     <a className="link-chip" href={props.href} target="_blank" rel="noreferrer">
//       {props.label}
//     </a>
//   );
// }

// function BibtexModal(props: {
//   show: boolean;
//   onHide: () => void;
//   paper?: Paper;
// }) {
//   const [copied, setCopied] = useState(false);

//   if (!props.paper) {
//     return null;
//   }

//   const bibtex = generateBibtex(props.paper);

//   return (
//     <Modal show={props.show} onHide={props.onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>BibTeX</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <pre className="bibtex-block">{bibtex}</pre>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button
//           active={copied}
//           onClick={() => {
//             setCopied(true);
//             setTimeout(() => setCopied(false), 2000);
//             navigator.clipboard.writeText(bibtex);
//           }}
//         >
//           <FontAwesomeIcon icon={faClipboard} /> {copied ? "Copied" : "Copy"}
//         </Button>
//         <Button variant="outline-secondary" onClick={props.onHide}>
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

// function renderAuthors(authors: Paper["author"]): ReactNode {
//   return authors.map((author, index) => {
//     const fullName = `${author.given} ${author.family}`;
//     const isUser = fullName.toLowerCase() === "zuyuan zhang";
//     const suffix = index === authors.length - 1 ? "" : index === authors.length - 2 ? ", and " : ", ";
//     return (
//       <span key={`${author.family}-${author.given}-${index}`}>
//         {isUser ? <strong>{fullName}</strong> : fullName}
//         {suffix}
//       </span>
//     );
//   });
// }

// function statusVariant(status?: string) {
//   switch (status) {
//     case "preprint":
//       return "warning";
//     case "accepted":
//       return "success";
//     case "under-review":
//       return "secondary";
//     default:
//       return "dark";
//   }
// }

// function PublicationCard(props: {
//   paper: Paper;
//   onBibtex: (paper: Paper) => void;
// }) {
//   const { paper, onBibtex } = props;
//   const [expanded, setExpanded] = useState(false);
//   const hasPreview = Boolean(paper.summary || paper.abstract || paper.image);

//   return (
//     <Card className="paper-card border-0 shadow-sm">
//       <Card.Body>
//         <div className="paper-header-row">
//           <div>
//             <div className="badge-row mb-2">
//               <Badge bg="primary-subtle" text="primary" pill>
//                 {getTypeLabel(paper)}
//               </Badge>
//               {paper.status && (
//                 <Badge bg={statusVariant(paper.status)} pill>
//                   {paper.status}
//                 </Badge>
//               )}
//               {paper.selected && (
//                 <Badge bg="success" pill>
//                   selected
//                 </Badge>
//               )}
//               {paper.award && (
//                 <Badge bg="info" pill>
//                   {paper.award}
//                 </Badge>
//               )}
//             </div>
//             <h3 className="paper-title">{paper.title}</h3>
//             <div className="paper-authors">{renderAuthors(paper.author)}</div>
//             <div className="paper-venue">
//               <strong>{getVenueShort(paper)}</strong>
//               {getVenueShort(paper) !== getVenue(paper) && <span> · {getVenue(paper)}</span>}
//               <span> · {paper.year}</span>
//               {paper.note && <span> · {paper.note}</span>}
//             </div>
//           </div>
//         </div>

//         {paper.tags && paper.tags.length > 0 && (
//           <div className="tag-group mt-3">
//             {paper.tags.map((tag) => (
//               <span className="tag-pill tag-pill-light" key={tag}>
//                 {tag}
//               </span>
//             ))}
//           </div>
//         )}

//         <div className="link-row">
//           {paper.preprint && <LinkChip href={paper.preprint} label="Preprint" />}
//           {paper.pdf && <LinkChip href={paper.pdf} label="PDF" />}
//           {paper.site && <LinkChip href={paper.site} label="Publisher" />}
//           {paper.project && <LinkChip href={paper.project} label="Project" />}
//           {paper.code && <LinkChip href={paper.code} label="Code" />}
//           {paper.slides && <LinkChip href={paper.slides} label="Slides" />}
//           {paper.poster && <LinkChip href={paper.poster} label="Poster" />}
//           {paper.video && <LinkChip href={paper.video} label="Video" />}
//           {paper.DOI && <LinkChip href={`https://doi.org/${paper.DOI}`} label="DOI" />}
//           <button className="link-chip button-like" onClick={() => onBibtex(paper)}>
//             BibTeX
//           </button>
//           {hasPreview && (
//             <button
//               className="link-chip button-like"
//               onClick={() => setExpanded((value) => !value)}
//             >
//               Preview <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
//             </button>
//           )}
//         </div>

//         {hasPreview && (
//           <Collapse in={expanded}>
//             <div className="preview-panel">
//               <Row className="g-3 align-items-center">
//                 {paper.image && (
//                   <Col md={paper.abstract || paper.summary ? 4 : 12}>
//                     <img
//                       src={paper.image}
//                       alt={`${paper.title} preview`}
//                       className="paper-preview-image"
//                     />
//                   </Col>
//                 )}
//                 {(paper.summary || paper.abstract) && (
//                   <Col md={paper.image ? 8 : 12}>
//                     {paper.summary && (
//                       <div className="preview-block">
//                         <div className="preview-label">Summary</div>
//                         <p className="mb-0">{paper.summary}</p>
//                       </div>
//                     )}
//                     {paper.abstract && (
//                       <div className="preview-block mt-3">
//                         <div className="preview-label">Abstract</div>
//                         <p className="mb-0">{paper.abstract}</p>
//                       </div>
//                     )}
//                   </Col>
//                 )}
//               </Row>
//             </div>
//           </Collapse>
//         )}
//       </Card.Body>
//     </Card>
//   );
// }

// function Publications() {
//   const [papers, setPapers] = useState<Paper[]>();
//   const [query, setQuery] = useState("");
//   const [filter, setFilter] = useState<FilterType>("all");
//   const [modalPaper, setModalPaper] = useState<Paper>();
//   const [showModal, setShowModal] = useState(false);

//   useEffect(() => {
//     loadYamlFile<Paper[]>("./data/publications.yaml").then((data) => {
//       const sorted = [...data].sort((a, b) => b.year - a.year);
//       setPapers(sorted);
//     });
//   }, []);

//   const filtered = useMemo(() => {
//     if (!papers) {
//       return [];
//     }

//     return papers.filter((paper) => {
//       const matchesFilter =
//         filter === "all"
//           ? true
//           : filter === "preprint"
//           ? paper.status === "preprint" || Boolean(paper.preprint)
//           : filter === "selected"
//           ? Boolean(paper.selected)
//           : paper.type === filter;

//       const haystack = [
//         paper.title,
//         paper.abstract,
//         paper.summary,
//         getVenue(paper),
//         paper.tags?.join(" "),
//         paper.author.map((item) => `${item.given} ${item.family}`).join(" "),
//       ]
//         .filter(Boolean)
//         .join(" ")
//         .toLowerCase();

//       return matchesFilter && haystack.includes(query.trim().toLowerCase());
//     });
//   }, [filter, papers, query]);

//   const perYear: { [year: string]: Paper[] } = filtered.reduce((result, item) => {
//     result[item.year] = result[item.year] || [];
//     result[item.year].push(item);
//     return result;
//   }, Object.create(null));

//   const years = Object.keys(perYear).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

//   return (
//     <App>
//       <section className="page-header-block">
//         <div className="section-title">
//           <FontAwesomeIcon icon={faBookOpen} /> Publications
//         </div>
//         <p className="text-muted mb-0">
//           Filter by publication type, search by keyword, and optionally expand a paper card to show
//           an abstract, visual preview, or short explanation.
//         </p>
//       </section>

//       <section className="section-card page-block">
//         <Row className="g-3 align-items-center">
//           <Col lg={6}>
//             <Form.Group>
//               <Form.Label>Search papers</Form.Label>
//               <div className="search-box">
//                 <FontAwesomeIcon icon={faMagnifyingGlass} />
//                 <Form.Control
//                   value={query}
//                   onChange={(event) => setQuery(event.target.value)}
//                   placeholder="title, venue, author, keyword..."
//                 />
//               </div>
//             </Form.Group>
//           </Col>
//           <Col lg={6}>
//             <Form.Label>Quick filters</Form.Label>
//             <div>
//               <ButtonGroup className="filter-group flex-wrap">
//                 <Button variant={filter === "all" ? "dark" : "outline-dark"} onClick={() => setFilter("all")}>All</Button>
//                 <Button variant={filter === "journal" ? "dark" : "outline-dark"} onClick={() => setFilter("journal")}>Journal</Button>
//                 <Button variant={filter === "conference" ? "dark" : "outline-dark"} onClick={() => setFilter("conference")}>Conference</Button>
//                 <Button variant={filter === "preprint" ? "dark" : "outline-dark"} onClick={() => setFilter("preprint")}>Preprint</Button>
//                 <Button variant={filter === "selected" ? "dark" : "outline-dark"} onClick={() => setFilter("selected")}>Selected</Button>
//               </ButtonGroup>
//             </div>
//           </Col>
//         </Row>
//       </section>

//       {!papers ? (
//         <Spinner animation="border" />
//       ) : (
//         <div className="page-block">
//           {years.length === 0 ? (
//             <section className="section-card">No papers match the current filter.</section>
//           ) : (
//             years.map((year) => (
//               <section className="year-block" key={year}>
//                 <h2 className="year-heading">{year}</h2>
//                 <div className="stack-list">
//                   {perYear[year].map((paper) => (
//                     <PublicationCard
//                       key={paper.id}
//                       paper={paper}
//                       onBibtex={(item) => {
//                         setModalPaper(item);
//                         setShowModal(true);
//                       }}
//                     />
//                   ))}
//                 </div>
//               </section>
//             ))
//           )}
//         </div>
//       )}

//       <BibtexModal show={showModal} onHide={() => setShowModal(false)} paper={modalPaper} />
//     </App>
//   );
// }

// export default Publications;

// import { useState, useEffect, ReactElement } from "react";
// import Spinner from "react-bootstrap/Spinner";
// import Modal from "react-bootstrap/Modal";
// import Button from "react-bootstrap/Button";
// import Card from "react-bootstrap/Card";
// import App from "./App";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faBookOpen, faClipboard } from "@fortawesome/free-solid-svg-icons";
// import { generateBibtex, getVenue, getColor, getAuthors } from "./Paper";
// import { Paper } from "./Types";
// import { load } from "js-yaml";

// function generateLink(url: string, name: string): ReactElement {
//   return <a href={url}>[{name}]</a>;
// }

// function objToString(item: Paper): string {
//   const venue: string = getVenue(item);
//   const authors = getAuthors(item);
//   if (item.type === "thesis") {
//     return `[THESIS] "${item.title}", ${item.school}, ${item.year}`;
//   }
//   return `${authors}, "${item.title}", ${venue}, ${item.year}${
//     item.note ? ` (${item.note})` : ""
//   }`;
// }

// function BibtexModal(props: any) {
//   const [copied, setCopied] = useState(false);

//   const paper: Paper = props.paper;
//   const bibtex = generateBibtex(paper);
//   return (
//     <Modal
//       {...props}
//       size="lg"
//       aria-labelledby="contained-modal-title-vcenter"
//       centered
//     >
//       <Modal.Header closeButton>
//         <Modal.Title id="contained-modal-title-vcenter">Bibtex</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <pre>{bibtex}</pre>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button
//           active={copied}
//           onClick={() => {
//             setCopied(true);
//             setTimeout(() => {
//               setCopied(false);
//             }, 3000);
//             navigator.clipboard.writeText(bibtex);
//           }}
//         >
//           <FontAwesomeIcon icon={faClipboard} />{" "}
//           {copied ? "Copied" : "Copy to clipboard"}
//         </Button>
//         <Button onClick={props.onHide}>Close</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }

// function Papers(props: { papers: Paper[] }) {
//   const [modalShow, setModalShow] = useState(false);
//   const [bibtexPaper, setBibtexPaper] = useState<Paper>();
//   const { papers } = props;

//   const perYear: { [year: string]: Paper[] } = papers.reduce((result, item) => {
//     result[item.year] = result[item.year] || [];
//     result[item.year].push(item);
//     return result;
//   }, Object.create(null));

//   const years = Object.keys(perYear).sort((a, b) => parseInt(b) - parseInt(a));
//   return (
//     <>
//       {years.map((y) => {
//         return (
//           <>
//             <h4 style={{ paddingTop: "10px" }}>{y}</h4>
//             {perYear[y].map((item) => {
//               return (
//                 <>
//                   <Card className="border-0" key={item.id}>
//                     <Card.Body
//                       className={`border-${getColor(item)}`}
//                       style={{ borderLeft: "10px solid", padding: "5px" }}
//                     >
//                       {objToString(item)}{" "}
//                       {item.site && generateLink(item.site, "SITE")}
//                       {item.pdf && generateLink(`${item.pdf}`, "PDF")}
//                       {item.DOI &&
//                         generateLink(`https://doi.org/${item.DOI}`, "DOI")}
//                       {item.type !== "thesis" && item.type !== "book" && (
//                         <a
//                           href=""
//                           onClick={(e) => {
//                             e.preventDefault();
//                             setModalShow(true);
//                             setBibtexPaper(item);
//                           }}
//                         >
//                           [Bibtex]
//                         </a>
//                       )}
//                     </Card.Body>
//                   </Card>
//                 </>
//               );
//             })}
//             {bibtexPaper && (
//               <BibtexModal
//                 show={modalShow}
//                 onHide={() => setModalShow(false)}
//                 paper={bibtexPaper}
//               />
//             )}
//           </>
//         );
//       })}
//     </>
//   );
// }

// async function loadYaml(path: string) {
//   const response = await fetch(path);
//   const text = await response.text();
//   const data: Paper[] = (await load(text)) as Paper[];
//   data.sort((a: Paper, b: Paper) => {
//     return b.year - a.year;
//   });
//   return data;
// }

// function List() {
//   const [papers, setPapers] = useState<Paper[]>();

//   useEffect(() => {
//     (async function () {
//       const data = await loadYaml(`./data/publications.yaml`);
//       setPapers(data);
//     })();
//   }, []);

//   return (
//     <>{!papers ? <Spinner animation="border" /> : <Papers papers={papers} />}</>
//   );
// }

// function Publications() {
//   return (
//     <App>
//       <h3>
//         <FontAwesomeIcon icon={faBookOpen} /> Publications
//       </h3>
//       <>
//         <br />
//         <h4>Bibliographic Profiles</h4>
//         {/* <Button
//           href="https://orcid.org/0000-0002-8599-2197"
//           variant="outline-success"
//         >
//           <i className="ai ai-orcid" /> ORCID
//         </Button>{" "} */}
//         <Button
//           href="https://scholar.google.com/citations?user=rlRzWFAAAAAJ&hl"
//           variant="outline-success"
//         >
//           <i className="ai ai-google-scholar" /> Google Scholar
//         </Button>{" "}
//         <Button
//           href=""
//           variant="outline-success"
//         >
//           <i className="ai ai-dblp" /> DBLP
//         </Button>
//         <br />
//         <br />
//       </>
//       <List />
//     </App>
//   );
// }

// export default Publications;
