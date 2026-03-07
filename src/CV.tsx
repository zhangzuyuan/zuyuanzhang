import { useEffect, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
import App from "./App";

function CV() {
  const [available, setAvailable] = useState<boolean | null>(null);
//   const cvPath = "/files/cv.pdf";
  const cvPath = `${process.env.PUBLIC_URL}/files/cv.pdf`;

  useEffect(() => {
    fetch(cvPath, { method: "HEAD" })
      .then((response) => setAvailable(response.ok))
      .catch(() => setAvailable(false));
  }, []);

  return (
    <App>
      <section className="page-header-block">
        <div className="section-title">
          <FontAwesomeIcon icon={faFileLines} /> Curriculum Vitae
        </div>
        {/* <p className="text-muted mb-0">
          Put your latest CV at <code>public/files/cv.pdf</code>. This page will automatically show the embedded preview.
        </p> */}
      </section>

      {available === null ? (
        <Spinner animation="border" />
      ) : available ? (
        <section className="section-card page-block">
          <div className="cv-actions">
            <Button href={cvPath} target="_blank" rel="noreferrer">
              Open PDF
            </Button>
            {/* <Button href={cvPath} variant="outline-dark" download>
              Download PDF
            </Button> */}
            <Button as="a" href={cvPath} variant="outline-dark" download>
                Download PDF
            </Button>
          </div>
          <iframe title="CV Preview" src={cvPath} className="cv-frame" />
        </section>
      ) : (
        <section className="section-card page-block">
          <Alert variant="warning" className="mb-0">
            No CV PDF found yet. Add your file to <code>public/files/cv.pdf</code> and rebuild the site.
          </Alert>
        </section>
      )}
    </App>
  );
}

export default CV;