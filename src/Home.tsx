import { useEffect, useState } from "react";
import { Col, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faNewspaper,
  faLocationArrow,
} from "@fortawesome/free-solid-svg-icons";
import App from "./App";
import Abstract from "./Abstract";
import { NewsItem, ResearchItem } from "./Types";
import { loadYamlFile } from "./data";

function Home() {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadYamlFile<any>("/data/research.yaml"),
      loadYamlFile<any>("/data/news.yaml"),
    ]).then(([researchData, newsData]) => {
      const normalizedResearch: ResearchItem[] = Array.isArray(researchData)
        ? researchData
        : Array.isArray(researchData?.research)
        ? researchData.research
        : Array.isArray(researchData?.items)
        ? researchData.items
        : Array.isArray(researchData?.default)
        ? researchData.default
        : [];

      const normalizedNews: NewsItem[] = Array.isArray(newsData)
        ? newsData
        : Array.isArray(newsData?.news)
        ? newsData.news
        : Array.isArray(newsData?.items)
        ? newsData.items
        : Array.isArray(newsData?.default)
        ? newsData.default
        : [];

      console.log("researchData =", researchData);
      console.log("normalizedResearch =", normalizedResearch);
      console.log("newsData =", newsData);
      console.log("normalizedNews =", normalizedNews);

      setResearch(normalizedResearch);
      setNews(normalizedNews);
      setLoading(false);
    });
  }, []);

  return (
    <App>
      <Abstract />

      <Row className="g-4 page-block">
        <Col lg={7}>
          <section className="section-card h-100">
            <div className="section-title">
              <FontAwesomeIcon icon={faBullseye} /> Research Focus
            </div>

            {loading ? (
              <Spinner animation="border" />
            ) : (
              <div className="stack-list">
                {research.slice(0, 3).map((item) => (
                  <div key={item.title} className="soft-panel">
                    <h3 className="item-title">{item.title}</h3>
                    <p className="mb-2">{item.description}</p>
                    {item.keywords && (
                      <div className="tag-group">
                        {item.keywords.map((keyword) => (
                          <span
                            className="tag-pill tag-pill-light"
                            key={`${item.title}-${keyword}`}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </Col>

        <Col lg={5}>
          <section className="section-card h-100">
            <div className="section-title">
              <FontAwesomeIcon icon={faNewspaper} /> Recent Updates
            </div>

            {loading ? (
              <Spinner animation="border" />
            ) : (
              <div className="timeline-list">
                {news.slice(0, 5).map((item) => (
                  <div
                    key={`${item.date}-${item.title}`}
                    className="timeline-item"
                  >
                    <div className="timeline-date">{item.date}</div>

                    <div>
                      <div className="item-title small-title">
                        {item.title}
                      </div>

                      {item.description && (
                        <p className="mb-0 text-muted">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Col>
      </Row>

      {/* <section className="section-card page-block">
        <div className="section-title">
          <FontAwesomeIcon icon={faLocationArrow} /> What this site now supports
        </div>
        <Row className="g-3">
          <Col md={4}>
            <div className="soft-panel h-100">
              <h3 className="item-title">Publication cards</h3>
              <p className="mb-0">
                Each paper can now include a preprint link, project page, code,
                slides, video, DOI, optional thumbnail, summary, and abstract
                preview.
              </p>
            </div>
          </Col>
          <Col md={4}>
            <div className="soft-panel h-100">
              <h3 className="item-title">Dedicated CV page</h3>
              <p className="mb-0">
                You can put <code>cv.pdf</code> under <code>public/files/</code>{" "}
                and the site will show both an embedded preview and direct
                open/download links.
              </p>
            </div>
          </Col>
          <Col md={4}>
            <div className="soft-panel h-100">
              <h3 className="item-title">Data-driven content</h3>
              <p className="mb-0">
                Profile, news, research themes, teaching, service, and
                publications are all editable from YAML without touching
                component logic.
              </p>
            </div>
          </Col>
        </Row>
      </section> */}
    </App>
  );
}

export default Home;


// import { useEffect, useState } from "react";
// import { Col, Row, Spinner } from "react-bootstrap";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBullseye,
//   faNewspaper,
//   faLocationArrow,
// } from "@fortawesome/free-solid-svg-icons";
// import App from "./App";
// import Abstract from "./Abstract";
// import { NewsItem, ResearchItem } from "./Types";
// import { loadYamlFile } from "./data";

// function Home() {
//   // const [research, setResearch] = useState<ResearchItem[]>();
//   const [research, setResearch] = useState<ResearchItem[]>([]);
//   // const [news, setNews] = useState<NewsItem[]>();
//   // const [news, setNews] = useState<NewsItem[]>([]);
//   const [news, setNews] = useState<NewsItem[]>([]);

//   useEffect(() => {
//     loadYamlFile<ResearchItem[]>("./data/research.yaml").then(setResearch);
//     // loadYamlFile<NewsItem[]>("./data/news.yaml").then(setNews);
//     loadYamlFile("./data/news.yaml").then((data: any) => {
//       setNews(data.default ?? data);
//     });
//   }, []);

//   return (
//     <App>
//       <Abstract />

//       <Row className="g-4 page-block">
//         <Col lg={7}>
//           <section className="section-card h-100">
//             <div className="section-title">
//               <FontAwesomeIcon icon={faBullseye} /> Research Focus
//             </div>
//             {/* {!research ? ( */}
//             {!Array.isArray(research) ? (
//               <Spinner animation="border" />
//             ) : (
//               <div className="stack-list">
//                 {/* {research.slice(0, 3).map((item) => ( */}
//                 {(research ?? []).slice(0, 3).map((item) => (
//                   <div key={item.title} className="soft-panel">
//                     <h3 className="item-title">{item.title}</h3>
//                     <p className="mb-2">{item.description}</p>
//                     {item.keywords && (
//                       <div className="tag-group">
//                         {item.keywords.map((keyword) => (
//                           <span className="tag-pill tag-pill-light" key={keyword}>
//                             {keyword}
//                           </span>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>
//         </Col>
        
//         <Col lg={5}>
//           <section className="section-card h-100">
//             <div className="section-title">
//               <FontAwesomeIcon icon={faNewspaper} /> Recent Updates
//             </div>

//             <div className="timeline-list">
//               {news.slice(0, 5).map((item) => (
//                 <div key={`${item.date}-${item.title}`} className="timeline-item">
//                   <div className="timeline-date">{item.date}</div>
              
//                   <div>
//                     <div className="item-title small-title">{item.title}</div>
              
//                     {item.description && (
//                       <p className="mb-0 text-muted">{item.description}</p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
            
//           </section>
//         </Col>
//         {/* <Col lg={5}>
//           <section className="section-card h-100">
//             <div className="section-title">
//               <FontAwesomeIcon icon={faNewspaper} /> Recent Updates
//             </div>
//             {!news ? (
//               <Spinner animation="border" />
//             ) : (
//               <div className="timeline-list">
//                 {news.slice(0, 5).map((item) => (
//                   <div key={`${item.date}-${item.title}`} className="timeline-item">
//                     <div className="timeline-date">{item.date}</div>
//                     <div>
//                       <div className="item-title small-title">{item.title}</div>
//                       {item.description && <p className="mb-0 text-muted">{item.description}</p>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </section>
//         </Col> */}
//       </Row>

//       <section className="section-card page-block">
//         <div className="section-title">
//           <FontAwesomeIcon icon={faLocationArrow} /> What this site now supports
//         </div>
//         <Row className="g-3">
//           <Col md={4}>
//             <div className="soft-panel h-100">
//               <h3 className="item-title">Publication cards</h3>
//               <p className="mb-0">
//                 Each paper can now include a preprint link, project page, code,
//                 slides, video, DOI, optional thumbnail, summary, and abstract preview.
//               </p>
//             </div>
//           </Col>
//           <Col md={4}>
//             <div className="soft-panel h-100">
//               <h3 className="item-title">Dedicated CV page</h3>
//               <p className="mb-0">
//                 You can put <code>cv.pdf</code> under <code>public/files/</code> and the
//                 site will show both an embedded preview and direct open/download links.
//               </p>
//             </div>
//           </Col>
//           <Col md={4}>
//             <div className="soft-panel h-100">
//               <h3 className="item-title">Data-driven content</h3>
//               <p className="mb-0">
//                 Profile, news, research themes, teaching, service, and publications
//                 are all editable from YAML without touching component logic.
//               </p>
//             </div>
//           </Col>
//         </Row>
//       </section>
//     </App>
//   );
// }

// export default Home;

// import App from "./App";
// import Abstract from "./Abstract";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faInbox,
//   faClock,
//   faCalendarPlus,
// } from "@fortawesome/free-solid-svg-icons";
// import {
//   faTwitter,
//   faGithub,
//   faLinkedin,
//   faMastodon,
// } from "@fortawesome/free-brands-svg-icons";
// import Button from "react-bootstrap/Button";

// function OfficeHours() {
//   return (
//     <div>
//       <h3>
//         <FontAwesomeIcon icon={faClock} /> Office Hours
//       </h3>
//       <p>
//         <b>14:00&#8211;16:00 Every Wednesday (Academic Year 2023/24)</b>
//       </p>
//       <ul>
//         <li>Use the below button to book a slot</li>
//         <li>
//           You can choose specific type of meetings (e.g., modules, personal
//           tutor, and others)
//         </li>
//         <li>Please add a note of the meeting agenda</li>
//         <li>
//           By default, meetings will be in-person at my office (McCrea 0-14)
//         </li>
//         <li>
//           If you are not able to have an in-person meeting, please let me know
//         </li>
//       </ul>
//       <Button href="https://outlook.office.com/bookwithme/user/2817d6351c804d8fbb61ccd7023a0a93@rhul.ac.uk?anonymous&ep=plink">
//         <FontAwesomeIcon icon={faCalendarPlus} /> Book a slot
//       </Button>
//     </div>
//   );
// }

// function Contact() {
//   return (
//     <>
//       <h3>
//         <FontAwesomeIcon icon={faInbox} /> Contact
//       </h3>
//       <h4>Mail: zuyuan dot zhang(AT)gwu dot edu</h4>
//       <Button href="https://www.linkedin.com/in/zuyuanzhang/">
//         <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
//       </Button>{" "}
//       <Button href="https://github.com/zhangzuyuan">
//         <FontAwesomeIcon icon={faGithub} /> Github
//       </Button>{" "}
//       <Button href="">
//         <FontAwesomeIcon icon={faTwitter} /> Twitter
//       </Button>{" "}
//       {/* <Button href="" rel="me">
//         <FontAwesomeIcon icon={faMastodon} /> Mastodon
//       </Button>{" "} */}
//       <br />
//       <br />
//       <h4>Address:</h4>
//       <span>
//         800 22nd Street NW <br />
//         5000 Science & Engineering Hall <br/>
//         Washington, DC 20052 <br />
//         Department of Electrical & Computer Engineering <br />
//         The George Washington University <br />
//         <br />
//       </span>
//       <iframe
//         title="Map"
//         src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3105.050750034402!2d-77.05184548687556!3d38.89995475800215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b7b7b1007cbb0b%3A0xacf508871307b2ea!2sThe%20Department%20of%20Electrical%20and%20Computer%20Engineering!5e0!3m2!1szh-CN!2sus!4v1706938287113!5m2!1szh-CN!2sus"
//         width="100%"
//         height="400em"
//         style={{ border: 0 }}
//         allowFullScreen={false}
//         loading="lazy"
//       ></iframe>
//       <h4>Visitor:</h4>
//       <a href='https://clustrmaps.com/site/1bzo8'  title='Visit tracker'><img width="100%" src='//clustrmaps.com/map_v2.png?cl=ffffff&w=1600&t=n&d=fozTtj2Y_h1aaQASPJCSEFQQC-fljE72l2Moaq0pj1E'/></a>
//     </>
//   );
// }

// function Home() {
//   return (
//     <App>
//       <Abstract />
//       <hr />
//       {/* <OfficeHours /> */}
//       <hr />
//       <Contact />
//     </App>
//   );
// }

// export default Home;
