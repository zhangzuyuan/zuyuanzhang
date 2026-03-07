import { useEffect, useState } from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlask } from "@fortawesome/free-solid-svg-icons";
import App from "./App";
import { ResearchItem } from "./Types";
import { loadYamlFile } from "./data";

function Research() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYamlFile<any>("/data/research.yaml").then((data) => {
      const normalizedItems: ResearchItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.research)
        ? data.research
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.default)
        ? data.default
        : [];

      console.log("research raw data =", data);
      console.log("research normalized =", normalizedItems);

      setItems(normalizedItems);
      setLoading(false);
    });
  }, []);

  return (
    <App>
      <section className="page-header-block">
        <div className="section-title">
          <FontAwesomeIcon icon={faFlask} /> Research
        </div>
        {/* <p className="text-muted mb-0">
          Use this page to organize your research into themes rather than leaving everything buried in a long publication list.
        </p> */}
      </section>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Row className="g-4 page-block">
          {items.map((item) => (
            <Col lg={6} key={item.title}>
              <Card className="section-card h-100 border-0">
                <Card.Body>
                  <h3 className="item-title">{item.title}</h3>
                  <p>{item.description}</p>

                  {item.keywords && (
                    <div className="tag-group mb-3">
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

                  {item.bullets && (
                    <ul className="list-clean list-spaced">
                      {item.bullets.map((bullet, idx) => (
                        <li key={`${item.title}-bullet-${idx}`}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {item.links && item.links.length > 0 && (
                    <div className="link-row mt-3">
                      {item.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          className="link-chip"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </App>
  );
}

export default Research;

// import { useEffect, useState } from "react";
// import { Card, Col, Row, Spinner } from "react-bootstrap";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faFlask } from "@fortawesome/free-solid-svg-icons";
// import App from "./App";
// import { ResearchItem } from "./Types";
// import { loadYamlFile } from "./data";

// function Research() {
//   const [items, setItems] = useState<ResearchItem[]>();

//   useEffect(() => {
//     loadYamlFile<ResearchItem[]>("./data/research.yaml").then(setItems);
//   }, []);

//   return (
//     <App>
//       <section className="page-header-block">
//         <div className="section-title">
//           <FontAwesomeIcon icon={faFlask} /> Research
//         </div>
//         <p className="text-muted mb-0">
//           Use this page to organize your research into themes rather than leaving everything buried in a long publication list.
//         </p>
//       </section>

//       {!items ? (
//         <Spinner animation="border" />
//       ) : (
//         <Row className="g-4 page-block">
//           {items.map((item) => (
//             <Col lg={6} key={item.title}>
//               <Card className="section-card h-100 border-0">
//                 <Card.Body>
//                   <h3 className="item-title">{item.title}</h3>
//                   <p>{item.description}</p>
//                   {item.keywords && (
//                     <div className="tag-group mb-3">
//                       {item.keywords.map((keyword) => (
//                         <span className="tag-pill tag-pill-light" key={keyword}>
//                           {keyword}
//                         </span>
//                       ))}
//                     </div>
//                   )}
//                   {item.bullets && (
//                     <ul className="list-clean list-spaced">
//                       {item.bullets.map((bullet) => (
//                         <li key={bullet}>{bullet}</li>
//                       ))}
//                     </ul>
//                   )}
//                   {item.links && item.links.length > 0 && (
//                     <div className="link-row mt-3">
//                       {item.links.map((link) => (
//                         <a key={link.url} href={link.url} className="link-chip" target="_blank" rel="noreferrer">
//                           {link.label}
//                         </a>
//                       ))}
//                     </div>
//                   )}
//                 </Card.Body>
//               </Card>
//             </Col>
//           ))}
//         </Row>
//       )}
//     </App>
//   );
// }

// export default Research;