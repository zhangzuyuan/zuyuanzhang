import { useEffect, useMemo, useState } from "react";
import { Badge, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faGraduationCap,
  faLocationDot,
  faTimeline,
} from "@fortawesome/free-solid-svg-icons";
import App from "./App";
import { EducationItem, Work } from "./Types";
import { loadYamlFile } from "./data";

type TimelineEntry = {
  id: string;
  year: number;
  kind: "education" | "work";
  title: string;
  subtitle: string;
  period: string;
  location?: string;
  description?: string;
};

function normalizeArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.education)) return data.education;
  if (Array.isArray(data?.work)) return data.work;
  if (Array.isArray(data?.default)) return data.default;
  return [];
}

function contractDateToText(date?: { month: string; year: number }) {
  if (!date) return "";
  return `${date.month} ${date.year}`;
}

function getWorkPeriod(item: Work) {
  const begin = contractDateToText(item.begin);
  const end = item.end ? contractDateToText(item.end) : "Present";
  return `${begin} — ${end}`;
}

function extractLatestYear(text?: string) {
  if (!text) return 0;
  const matches = text.match(/\d{4}/g);
  if (!matches || matches.length === 0) return 0;
  return Math.max(...matches.map((x) => parseInt(x, 10)));
}

function getEducationDescription(item: EducationItem) {
  const parts: string[] = [];

  if (item.thesis) {
    parts.push(`Thesis: ${item.thesis}`);
  }

  if (item.supervisor && item.supervisor.length > 0) {
    const names = item.supervisor.map((s) => s.name).join(", ");
    parts.push(`Supervisor${item.supervisor.length > 1 ? "s" : ""}: ${names}`);
  }

  return parts.join(" · ");
}

function Timeline() {
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [work, setWork] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadYamlFile<any>("/data/education.yaml"),
      loadYamlFile<any>("/data/work.yaml"),
    ])
      .then(([educationData, workData]) => {
        setEducation(normalizeArray<EducationItem>(educationData));
        setWork(normalizeArray<Work>(workData));
      })
      .finally(() => setLoading(false));
  }, []);

  const entries = useMemo<TimelineEntry[]>(() => {
    const educationEntries: TimelineEntry[] = education.map((item, index) => ({
      id: `edu-${index}-${item.school}-${item.degree}`,
      year: extractLatestYear(item.period),
      kind: "education",
      title: item.degree,
      subtitle: `${item.school}${item.department ? ` · ${item.department}` : ""}`,
      period: item.period,
      description: getEducationDescription(item),
    }));

    const workEntries: TimelineEntry[] = work.map((item, index) => ({
      id: `work-${index}-${item.affiliation}-${item.title}`,
      year: item.end?.year ?? item.begin.year,
      kind: "work",
      title: item.title,
      subtitle: item.affiliation,
      period: getWorkPeriod(item),
      location:
        item.city || item.country
          ? [item.city, item.country].filter(Boolean).join(", ")
          : undefined,
      description: item.summary,
    }));

    return [...workEntries, ...educationEntries].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return a.kind.localeCompare(b.kind);
    });
  }, [education, work]);

  const grouped = useMemo(() => {
    const result: Record<string, TimelineEntry[]> = Object.create(null);
    entries.forEach((entry) => {
      const key = String(entry.year || "Other");
      result[key] = result[key] || [];
      result[key].push(entry);
    });
    return result;
  }, [entries]);

  const years = useMemo(
    () =>
      Object.keys(grouped).sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return parseInt(b, 10) - parseInt(a, 10);
      }),
    [grouped]
  );

  return (
    <App>
      <section className="page-header-block">
        <div className="section-title">
          <FontAwesomeIcon icon={faTimeline} /> Timeline
        </div>
        <p className="text-muted mb-0">
          A chronological view of education and professional experience.
        </p>
      </section>

      {loading ? (
        <Spinner animation="border" />
      ) : years.length === 0 ? (
        <section className="section-card page-block">
          No timeline items found. Please check <code>public/data/education.yaml</code> and{" "}
          <code>public/data/work.yaml</code>.
        </section>
      ) : (
        <div className="page-block">
          {years.map((year) => (
            <section className="section-card mb-4" key={year}>
              <h2 className="year-heading mb-4">{year}</h2>

              <div className="timeline-vertical">
                {grouped[year].map((entry) => (
                  <div className="timeline-node-row" key={entry.id}>
                    <div className="timeline-node-col">
                      <div className="timeline-node">
                        <FontAwesomeIcon
                          icon={entry.kind === "work" ? faBriefcase : faGraduationCap}
                        />
                      </div>
                      <div className="timeline-line" />
                    </div>

                    <div className="timeline-content-card">
                      <div className="timeline-card-top">
                        <div>
                          <div className="timeline-item-title">{entry.title}</div>
                          <div className="timeline-item-subtitle">{entry.subtitle}</div>
                        </div>

                        <Badge
                          bg={entry.kind === "work" ? "primary-subtle" : "success"}
                          text={entry.kind === "work" ? "primary" : undefined}
                          pill
                        >
                          {entry.kind === "work" ? "Work" : "Education"}
                        </Badge>
                      </div>

                      <div className="timeline-meta-row">
                        <span className="timeline-period">{entry.period}</span>
                        {entry.location && (
                          <span className="timeline-location">
                            <FontAwesomeIcon icon={faLocationDot} /> {entry.location}
                          </span>
                        )}
                      </div>

                      {entry.description && (
                        <p className="timeline-description mb-0">{entry.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </App>
  );
}

export default Timeline;

// import { useState, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faClock,
//   faBriefcase,
//   faGraduationCap,
// } from "@fortawesome/free-solid-svg-icons";
// import Spinner from "react-bootstrap/Spinner";
// import { load } from "js-yaml";
// import { EducationItem, Work, TimelineItem } from "./Types";
// import App from "./App";

// import {
//   VerticalTimeline,
//   VerticalTimelineElement,
// } from "react-vertical-timeline-component";
// import "react-vertical-timeline-component/style.min.css";

// function Timeline() {
//   const [education, setEducation] = useState<EducationItem[]>();
//   useEffect(() => {
//     fetch("./data/education.yaml").then(async (response) => {
//       const text = await response.text();
//       const data = (await load(text)) as EducationItem[];
//       setEducation(data);
//     });
//   }, []);

//   const [work, setWork] = useState<Work[]>();
//   useEffect(() => {
//     fetch("./data/work.yaml").then(async (response) => {
//       const text = await response.text();
//       const data: Work[] = (await load(text)) as Work[];
//       setWork(data);
//     });
//   }, []);

//   const [items, setItems] = useState<TimelineItem[]>();
//   useEffect(() => {
//     if (!education || !work) {
//       return;
//     }

//     const tempItems: Array<TimelineItem> = [];
//     education.forEach((item) => {
//       const t: TimelineItem = {
//         title: item.degree,
//         affiliation: item.school,
//         date: item.period.match(/\d+/g)![0],
//         type: "education",
//       };
//       tempItems.push(t);
//     });
//     work.forEach((item) => {
//       const t: TimelineItem = {
//         title: item.title,
//         affiliation: `${item.affiliation}`,
//         city: `${item.city}, ${item.country}`,
//         date: `${item.begin.year} - ${item.end ? item.end.year : "Present"}`,
//         type: "work",
//       };
//       if (item.end && item.begin.year === item.end.year) {
//         t.date = `${item.begin.year}`;
//       }
//       tempItems.push(t);
//     });

//     tempItems.sort((a, b) => (a.date > b.date ? -1 : 1));
//     setItems(tempItems);
//     console.log(tempItems);
//   }, [education, work]);

//   return (
//     // <App style={{ background: "#aaa" }}>
//     <App>
//       <h3>
//         <FontAwesomeIcon icon={faClock} /> Timeline
//       </h3>
//       {!items ? (
//         <Spinner animation="border" />
//       ) : (
//         <>
//           <VerticalTimeline lineColor="#aaa">
//             {items.map((item) => {
//               return (
//                 <VerticalTimelineElement
//                   contentStyle={{ background: "#eee" }}
//                   contentArrowStyle={{ borderRight: "15px solid #eee" }}
//                   className={`vertical-timeline-element--${item.type}`}
//                   iconStyle={{
//                     background:
//                       item.type === "work"
//                         ? "rgb(33, 150, 243)"
//                         : "rgb(233, 30, 99)",
//                     color: "#fff",
//                   }}
//                   icon={
//                     <FontAwesomeIcon
//                       size="lg"
//                       icon={
//                         item.type === "work" ? faBriefcase : faGraduationCap
//                       }
//                     />
//                   }
//                   date={item.date}
//                 >
//                   <h3 className="vertical-timeline-element-title">
//                     {item.title}
//                   </h3>
//                   <h4 className="vertical-timeline-element-subtitle">
//                     {item.affiliation}
//                   </h4>
//                   {item.city && (
//                     <h4 className="vertical-timeline-element-subtitle">
//                       {item.city}
//                     </h4>
//                   )}
//                   <p>{item.description}</p>
//                 </VerticalTimelineElement>
//               );
//             })}
//             <VerticalTimelineElement
//               iconStyle={{ background: "rgb(16, 204, 82)", color: "#fff" }}
//             />
//           </VerticalTimeline>
//         </>
//       )}
//     </App>
//   );
// }

// export default Timeline;