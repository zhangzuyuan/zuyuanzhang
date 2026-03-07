import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faNewspaper } from "@fortawesome/free-solid-svg-icons";
import App from "./App";
import { NewsItem } from "./Types";
import { loadYamlFile } from "./data";

function News() {
  const [items, setItems] = useState<NewsItem[]>();

  useEffect(() => {
    loadYamlFile<NewsItem[]>("/data/news.yaml").then(setItems);
  }, []);

  return (
    <App>
      <section className="page-header-block">
        <div className="section-title">
          <FontAwesomeIcon icon={faNewspaper} /> News
        </div>
        <p className="text-muted mb-0">
          A simple updates page helps visitors immediately see what is recent without scanning your entire publication history.
        </p>
      </section>

      {!items ? (
        <Spinner animation="border" />
      ) : (
        <section className="section-card page-block">
          <div className="timeline-list">
            {items.map((item) => (
              <div className="timeline-item" key={`${item.date}-${item.title}`}>
                <div className="timeline-date">{item.date}</div>
                <div>
                  <div className="item-title small-title">{item.title}</div>
                  {item.description && <p className="mb-1 text-muted">{item.description}</p>}
                  {item.link && (
                    <a href={item.link} className="link-chip" target="_blank" rel="noreferrer">
                      Open
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </App>
  );
}

export default News;