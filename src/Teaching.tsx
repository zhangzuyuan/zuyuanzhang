import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardTeacher } from "@fortawesome/free-solid-svg-icons";
import Spinner from "react-bootstrap/Spinner";
import { Teaching } from "./Types";
import App from "./App";
import { loadYamlFile } from "./data";

function TeachingExperience() {
  const [teaching, setTeaching] = useState<Teaching[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYamlFile<Teaching[]>("/data/teaching.yaml")
      .then((data) => {
        setTeaching(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load teaching.yaml:", err);
        setTeaching([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <App>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <>
          <h3>
            <FontAwesomeIcon icon={faChalkboardTeacher} /> Teaching
          </h3>
          <ul>
            {teaching.map((item, i) => {
              return (
                <li key={`${item.course}-${item.school}-${i}`}>
                  {item.course}, {item.school}, {item.date}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </App>
  );
}

export default TeachingExperience;


// import { useState, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faChalkboardTeacher } from "@fortawesome/free-solid-svg-icons";
// import Spinner from "react-bootstrap/Spinner";
// import { load } from "js-yaml";
// import { Teaching } from "./Types";
// import App from "./App";

// function TeachingExperience() {
//   const [teaching, setTeaching] = useState<Teaching[]>();

//   useEffect(() => {
//     fetch("/data/teaching.yaml").then(async (response) => {
//       const text = await response.text();
//       const data: Teaching[] = (await load(text)) as Teaching[];
//       setTeaching(data);
//     });
//   }, []);

//   return (
//     <App>
//       {!teaching ? (
//         <Spinner animation="border" />
//       ) : (
//         <>
//           <h3>
//             <FontAwesomeIcon icon={faChalkboardTeacher} /> Teaching
//           </h3>
//           <ul>
//             {teaching.map((item, i) => {
//               return (
//                 <li
//                   key={i}
//                 >{`${item.course}, ${item.school}, ${item.date}`}</li>
//               );
//             })}
//           </ul>
//         </>
//       )}
//     </App>
//   );
// }

// export default TeachingExperience;
