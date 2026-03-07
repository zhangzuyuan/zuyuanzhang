import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
import Spinner from "react-bootstrap/Spinner";
import { Work } from "./Types";
import { loadYamlFile } from "./data";

function WorkExperience() {
  const [work, setWork] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYamlFile<Work[]>("/data/work.yaml")
      .then((data) => {
        setWork(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load work.yaml:", err);
        setWork([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return loading ? (
    <Spinner animation="border" />
  ) : (
    <>
      <h3>
        <FontAwesomeIcon icon={faBriefcase} /> Work Experience
      </h3>
      <ul>
        {work.map((item, i) => {
          return (
            <li key={`${item.affiliation}-${item.title}-${i}`}>
              {item.title},{" "}
              {item.url ? (
                <a href={item.url}>{item.affiliation}</a>
              ) : (
                item.affiliation
              )}
              , {item.city}, {item.country}, {item.begin.month}{" "}
              {item.begin.year}&#8211;
              {item.end ? `${item.end.month} ${item.end.year}` : "Present"}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default WorkExperience;

// import { useState, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faBriefcase } from "@fortawesome/free-solid-svg-icons";
// import Spinner from "react-bootstrap/Spinner";
// import { load } from "js-yaml";
// import { Work } from "./Types";

// function WorkExperience() {
//   const [work, setWork] = useState<Work[]>();

//   useEffect(() => {
//     fetch("./data/work.yaml").then(async (response) => {
//       const text = await response.text();
//       const data: Work[] = (await load(text)) as Work[];
//       setWork(data);
//     });
//   }, []);

//   return !work ? (
//     <Spinner animation="border" />
//   ) : (
//     <>
//       <h3>
//         <FontAwesomeIcon icon={faBriefcase} /> Work Experience
//       </h3>
//       <ul>
//         {work.map((item, i) => {
//           return (
//             <li key={i}>
//               {item.title},{" "}
//               {item.url ? (
//                 <a href={item.url}>{item.affiliation}</a>
//               ) : (
//                 item.affiliation
//               )}
//               , {item.city}, {item.country}, {item.begin.month}{" "}
//               {item.begin.year}&#8211;
//               {item.end ? `${item.end.month} ${item.end.year}` : "Present"}
//             </li>
//           );
//         })}
//       </ul>
//     </>
//   );
// }

// export default WorkExperience;
