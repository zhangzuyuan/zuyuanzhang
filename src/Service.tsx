import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import Spinner from "react-bootstrap/Spinner";
import { ServiceItem } from "./Types";
import App from "./App";
import { loadYamlFile } from "./data";

function Service() {
  const [service, setService] = useState<ServiceItem[]>([]);
  const [subreview, setSubreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadYamlFile<{
      service?: ServiceItem[];
      subreview?: string[];
    }>("/data/service.yaml")
      .then((data) => {
        setService(Array.isArray(data?.service) ? data.service : []);
        setSubreview(Array.isArray(data?.subreview) ? data.subreview : []);
      })
      .catch((err) => {
        console.error("Failed to load service.yaml:", err);
        setService([]);
        setSubreview([]);
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
            <FontAwesomeIcon icon={faLink} /> Service
          </h3>
          <ul>
            {service.map((item, i) => {
              return (
                <li key={`${item.title}-${item.venue}-${i}`}>
                  {item.title}, {item.venue}, {item.date}
                </li>
              );
            })}
          </ul>
          {subreview.length > 0 && (
            <p style={{ paddingLeft: "2rem" }}>
              In addition, I was a sub-reviewer for these conferences:&nbsp;
              {subreview.join(", ")}
            </p>
          )}
        </>
      )}
    </App>
  );
}

export default Service;

// import { useState, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faLink } from "@fortawesome/free-solid-svg-icons";
// import Spinner from "react-bootstrap/Spinner";
// import { load } from "js-yaml";
// import { ServiceItem } from "./Types";
// import App from "./App";

// function Service() {
//   const [service, setService] = useState<ServiceItem[]>();
//   const [subreview, setSubreview] = useState<string[]>();

//   useEffect(() => {
//     fetch("./data/service.yaml").then(async (response) => {
//       const text = await response.text();
//       const data = (await load(text)) as {
//         service: ServiceItem[];
//         subreview: string[];
//       };
//       setService(data.service);
//       setSubreview(data.subreview);
//     });
//   }, []);

//   return (
//     <App>
//       {!service ? (
//         <Spinner animation="border" />
//       ) : (
//         <>
//           <h3>
//             <FontAwesomeIcon icon={faLink} /> Service
//           </h3>
//           <ul>
//             {service.map((item, i) => {
//               return (
//                 <li key={i}>{`${item.title}, ${item.venue}, ${item.date}`}</li>
//               );
//             })}
//           </ul>
//           {subreview && (
//             <p style={{ paddingLeft: "2rem" }}>
//               In addition, I was a sub-reviewer for these conferences:&nbsp;
//               {subreview.join(", ")}
//             </p>
//           )}
//         </>
//       )}
//     </App>
//   );
// }

// export default Service;
