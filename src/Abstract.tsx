import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeUp } from "@fortawesome/free-solid-svg-icons";

function playFirstName() {
  var audio = new Audio("donggyun.m4a");
  audio.play();
}

function Abstract() {
  return (
    <Container style={{ marginTop: "2rem", marginBottom: "1rem" }}>
      <Row className="align-items-center">
        <Col md="auto">
          <img src="./profile.png" width={200} alt="Zuyuan Zhang" />
        </Col>
        <Col>
          <h2>
            Zuyuan Zhang
            {/* <sup style={{ fontSize: "60%" }}>
              <FontAwesomeIcon icon={faVolumeUp} onClick={playFirstName} />
            </sup>{" "} */}
          </h2>
          <h5>PhD Candidate</h5>
          <h5>Department of Electrical and Computer Engineering</h5>
          <h5>The George Washington University</h5>
          I'm currently a second-year Ph.D. Candidate at the Department of ECE, George Washington University, in the Lab for Intelligent Networking and Computing.
          I'm fortunate and grateful to be advised by{" "}
          <a href="https://www2.seas.gwu.edu/~tlan/">
            Prof. Tian Lan
          </a>{" "}
          and worked with{" "}
          <a href="https://web.ics.purdue.edu/~vaneet/">
          Prof. Vaneet Aggarwal
          </a>
          ,{" "}
          <a href="https://imani.lab.northeastern.edu/">
          Prof. Mahdi Imani
          </a>.{" "}
          and{" "}
          <a href="http://fdcl.seas.gwu.edu/">
          Prof. Taeyoung Lee
          </a>.{" "}
          I'm interested in Reinforcement learning, Federated Learning, and Generative Models.
          I obtained my bachelor’s degree (with distinction) in Computer Science from the{" "}
          <a href="https://www.tsxt.sdu.edu.cn/">
          Taishan (Honors) College 
          </a>{" "}
          at Shandong University in 2023.
        </Col>
      </Row>
    </Container>
  );
}

export default Abstract;
