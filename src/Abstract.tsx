import { useEffect, useState } from "react";
import { Button, Col, Row, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faFileLines,
  faLocationDot,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { Profile } from "./Types";
import { loadYamlFile } from "./data";

function getSocialIcon(label?: string) {
  switch ((label || "").toLowerCase()) {
    case "github":
      return faGithub;
    case "google scholar":
      return faUserGraduate;
    case "linkedin":
      return faLinkedin;
    default:
      return faEnvelope;
  }
}

function Abstract() {
  const [profile, setProfile] = useState<Profile>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYamlFile<Profile>("/data/profile.yaml")
      .then(setProfile)
      .catch((err) => {
        console.error("Failed to load profile.yaml:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading || !profile) {
    return <Spinner animation="border" />;
  }
  function obfuscateEmail(email?: string) {
    if (!email) return "";
    return email.replace(/@/g, " AT ").replace(/\./g, " dot ");
  }

  const profileImageSrc =
    profile.profileImage?.startsWith("http")
      ? profile.profileImage
      : profile.profileImage
      ? `${process.env.PUBLIC_URL}${profile.profileImage}`
      : `${process.env.PUBLIC_URL}/profile.png`;

  return (
    <section className="hero-card">
      <Row className="align-items-center g-4">
        <Col lg={4} className="text-center text-lg-start">
          <img
            src={profileImageSrc}
            className="hero-avatar"
            alt={profile.name}
          />
        </Col>
        <Col lg={8}>
          {/* <div className="eyebrow">Academic Homepage</div> */}
          <h1 className="hero-name">{profile.name}</h1>
          <p className="hero-role mb-2">{profile.title}</p>
          <p className="hero-affiliation mb-3">
            <FontAwesomeIcon icon={faUserGraduate} /> {profile.affiliation}
          </p>

          <div className="hero-bio">
            {profile.bio?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="tag-group mb-4">
            {profile.interests?.map((item) => (
              <span key={item} className="tag-pill">
                {item}
              </span>
            ))}
          </div>

          <div className="hero-actions">
            {/* <Button variant="dark" href={`mailto:${profile.email}`}>
              <FontAwesomeIcon icon={faEnvelope} /> Email
            </Button> */}
            <Button
              variant="outline-dark"
              href={profile.cvUrl || `${process.env.PUBLIC_URL}/files/cv.pdf`}
            >
              <FontAwesomeIcon icon={faFileLines} /> CV
            </Button>
            {profile.socials?.map((item) => (
              <Button
                variant="outline-dark"
                href={item.url}
                key={item.label}
                target="_blank"
                rel="noreferrer"
              >
                <FontAwesomeIcon icon={getSocialIcon(item.label)} /> {item.label}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      <div className="hero-subgrid">
        <div className="info-card">
          <div className="info-label">Contact</div>
          {/* <div>{profile.email}</div> */}
          <div>
            <FontAwesomeIcon icon={faEnvelope} /> {obfuscateEmail(profile.email)}
          </div>
          <div>{profile.location}</div>
          {profile.office && <div>{profile.office}</div>}
        </div>
        <div className="info-card">
          <div className="info-label">Advisor</div>
          {profile.advisorUrl ? (
            <a href={profile.advisorUrl} target="_blank" rel="noreferrer">
              {profile.advisor}
            </a>
          ) : (
            <div>{profile.advisor}</div>
          )}
        </div>
        <div className="info-card">
          <div className="info-label">Location</div>
          <div>
            <FontAwesomeIcon icon={faLocationDot} /> {profile.location}
          </div>
        </div>
        {profile.mapEmbedUrl && (
          <div className="map-card mt-4">
            <div className="info-label mb-2">Map</div>
            <iframe
              title="Office location map"
              src={profile.mapEmbedUrl}
              width="100%"
              height="320"
              style={{ border: 0, borderRadius: "16px" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
        {profile.visitorMapImage && (
         <div className="map-card mt-4">
           <div className="info-label mb-2">Visitors Around the World</div>
           {profile.visitorMapUrl ? (
             <a
               href={profile.visitorMapUrl}
               target="_blank"
               rel="noreferrer"
               title="Visitor tracker"
             >
               <img
                 src={profile.visitorMapImage}
                 alt="Global visitor map"
                 style={{
                   width: "100%",
                   borderRadius: "16px",
                   display: "block",
                 }}
               />
             </a>
           ) : (
             <img
               src={profile.visitorMapImage}
               alt="Global visitor map"
               style={{
                 width: "100%",
                 borderRadius: "16px",
                 display: "block",
               }}
             />
           )}
         </div>
       )}
      </div>
    </section>
  );
}

export default Abstract;


// import { useEffect, useState } from "react";
// import { Button, Col, Row, Spinner } from "react-bootstrap";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faEnvelope,
//   faFileLines,
//   faLocationDot,
//   faUserGraduate,
// } from "@fortawesome/free-solid-svg-icons";
// import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
// import { Profile } from "./Types";
// import { loadYamlFile } from "./data";

// function getSocialIcon(label?: string) {
//   switch ((label || "").toLowerCase()) {
//     case "github":
//       return faGithub;
//     case "google scholar":
//       return faUserGraduate;
//     case "linkedin":
//       return faLinkedin;
//     default:
//       return faEnvelope;
//   }
// }

// function Abstract() {
//   const [profile, setProfile] = useState<Profile>();

//   useEffect(() => {
//     loadYamlFile<Profile>("/data/profile.yaml").then(setProfile);
//   }, []);

//   if (!profile) {
//     return <Spinner animation="border" />;
//   }

//   const profileImageSrc =
//     profile.profileImage?.startsWith("http")
//       ? profile.profileImage
//       : profile.profileImage
//       ? `${process.env.PUBLIC_URL}${profile.profileImage}`
//       : `${process.env.PUBLIC_URL}/profile.png`;

//   return (
//     <section className="hero-card">
//       <Row className="align-items-center g-4">
//         <Col lg={4} className="text-center text-lg-start">
//           <img
//             // src={profile.profileImage || "/profile.png"}
//             src={profileImageSrc}
//             className="hero-avatar"
//             alt={profile.name}
//           />
//         </Col>
//         <Col lg={8}>
//           <div className="eyebrow">Academic Homepage</div>
//           <h1 className="hero-name">{profile.name}</h1>
//           <p className="hero-role mb-2">{profile.title}</p>
//           <p className="hero-affiliation mb-3">
//             <FontAwesomeIcon icon={faUserGraduate} /> {profile.affiliation}
//           </p>

//           <div className="hero-bio">
//             {/* {profile.bio.map((paragraph, index) => (
//               <p key={index}>{paragraph}</p>
//             ))}
//              */}
//              {profile.bio?.map((paragraph, index) => (
//               <p key={index}>{paragraph}</p>
//               ))}
//           </div>

//           <div className="tag-group mb-4">
//             {profile.interests?.map((item) => (
//               <span key={item} className="tag-pill">
//                 {item}
//               </span>
//             ))}
//           </div>

//           <div className="hero-actions">
//             <Button variant="dark" href={`mailto:${profile.email}`}>
//               <FontAwesomeIcon icon={faEnvelope} /> Email
//             </Button>
//             <Button variant="outline-dark" href={profile.cvUrl || "./files/cv.pdf"}>
//               <FontAwesomeIcon icon={faFileLines} /> CV
//             </Button>
//             {profile.socials?.map((item) => (
//               <Button
//                 variant="outline-dark"
//                 href={item.url}
//                 key={item.label}
//                 target="_blank"
//                 rel="noreferrer"
//               >
//                 <FontAwesomeIcon icon={getSocialIcon(item.label)} /> {item.label}
//               </Button>
//             ))}
//           </div>
//         </Col>
//       </Row>

//       <div className="hero-subgrid">
//         <div className="info-card">
//           <div className="info-label">Contact</div>
//           <div>{profile.email}</div>
//           <div>{profile.location}</div>
//           {profile.office && <div>{profile.office}</div>}
//         </div>
//         <div className="info-card">
//           <div className="info-label">Advisor</div>
//           {profile.advisorUrl ? (
//             <a href={profile.advisorUrl} target="_blank" rel="noreferrer">
//               {profile.advisor}
//             </a>
//           ) : (
//             <div>{profile.advisor}</div>
//           )}
//         </div>
//         <div className="info-card">
//           <div className="info-label">Location</div>
//           <div>
//             <FontAwesomeIcon icon={faLocationDot} /> {profile.location}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// export default Abstract;

// import Container from "react-bootstrap/Container";
// import Row from "react-bootstrap/Row";
// import Col from "react-bootstrap/Col";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faVolumeUp } from "@fortawesome/free-solid-svg-icons";

// function playFirstName() {
//   var audio = new Audio("donggyun.m4a");
//   audio.play();
// }

// function Abstract() {
//   return (
//     <Container style={{ marginTop: "2rem", marginBottom: "1rem" }}>
//       <Row className="align-items-center">
//         <Col md="auto">
//           <img src="./profile.png" width={200} alt="Zuyuan Zhang" />
//         </Col>
//         <Col>
//           <h2>
//             Zuyuan Zhang
//             {/* <sup style={{ fontSize: "60%" }}>
//               <FontAwesomeIcon icon={faVolumeUp} onClick={playFirstName} />
//             </sup>{" "} */}
//           </h2>
//           <h5>PhD Candidate</h5>
//           <h5>Department of Electrical and Computer Engineering</h5>
//           <h5>The George Washington University</h5>
//           I'm currently a third-year Ph.D. Candidate at the Department of ECE, George Washington University, in the Lab for Intelligent Networking and Computing.
//           I'm fortunate and grateful to be advised by{" "}
//           <a href="https://www2.seas.gwu.edu/~tlan/">
//             Prof. Tian Lan
//           </a>{" "}
//           and worked with{" "}
//           <a href="https://web.ics.purdue.edu/~vaneet/">
//           Prof. Vaneet Aggarwal
//           </a>
//           ,{" "}
//           <a href="https://imani.lab.northeastern.edu/">
//           Prof. Mahdi Imani
//           </a>.{" "}
//           and{" "}
//           <a href="http://fdcl.seas.gwu.edu/">
//           Prof. Taeyoung Lee
//           </a>.{" "}
//           I'm interested in Reinforcement learning, Federated Learning, and Generative Models.
//           I obtained my bachelor’s degree (with distinction) in Computer Science from the{" "}
//           <a href="https://www.tsxt.sdu.edu.cn/">
//           Taishan (Honors) College 
//           </a>{" "}
//           at Shandong University in 2023.
//         </Col>
//       </Row>
//     </Container>
//   );
// }

// export default Abstract;
