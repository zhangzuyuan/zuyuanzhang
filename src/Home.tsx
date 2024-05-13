import App from "./App";
import Abstract from "./Abstract";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInbox,
  faClock,
  faCalendarPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faGithub,
  faLinkedin,
  faMastodon,
} from "@fortawesome/free-brands-svg-icons";
import Button from "react-bootstrap/Button";

function OfficeHours() {
  return (
    <div>
      <h3>
        <FontAwesomeIcon icon={faClock} /> Office Hours
      </h3>
      <p>
        <b>14:00&#8211;16:00 Every Wednesday (Academic Year 2023/24)</b>
      </p>
      <ul>
        <li>Use the below button to book a slot</li>
        <li>
          You can choose specific type of meetings (e.g., modules, personal
          tutor, and others)
        </li>
        <li>Please add a note of the meeting agenda</li>
        <li>
          By default, meetings will be in-person at my office (McCrea 0-14)
        </li>
        <li>
          If you are not able to have an in-person meeting, please let me know
        </li>
      </ul>
      <Button href="https://outlook.office.com/bookwithme/user/2817d6351c804d8fbb61ccd7023a0a93@rhul.ac.uk?anonymous&ep=plink">
        <FontAwesomeIcon icon={faCalendarPlus} /> Book a slot
      </Button>
    </div>
  );
}

function Contact() {
  return (
    <>
      <h3>
        <FontAwesomeIcon icon={faInbox} /> Contact
      </h3>
      <h4>Mail: zuyuan dot zhang(AT)gwu dot edu</h4>
      <Button href="https://www.linkedin.com/in/zuyuanzhang/">
        <FontAwesomeIcon icon={faLinkedin} /> LinkedIn
      </Button>{" "}
      <Button href="https://github.com/zhangzuyuan">
        <FontAwesomeIcon icon={faGithub} /> Github
      </Button>{" "}
      <Button href="">
        <FontAwesomeIcon icon={faTwitter} /> Twitter
      </Button>{" "}
      {/* <Button href="" rel="me">
        <FontAwesomeIcon icon={faMastodon} /> Mastodon
      </Button>{" "} */}
      <br />
      <br />
      <h4>Address:</h4>
      <span>
        800 22nd Street NW <br />
        5000 Science & Engineering Hall <br/>
        Washington, DC 20052 <br />
        Department of Electrical & Computer Engineering <br />
        The George Washington University <br />
        <br />
      </span>
      <iframe
        title="Map"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3105.050750034402!2d-77.05184548687556!3d38.89995475800215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b7b7b1007cbb0b%3A0xacf508871307b2ea!2sThe%20Department%20of%20Electrical%20and%20Computer%20Engineering!5e0!3m2!1szh-CN!2sus!4v1706938287113!5m2!1szh-CN!2sus"
        width="100%"
        height="400em"
        style={{ border: 0 }}
        allowFullScreen={false}
        loading="lazy"
      ></iframe>
      <h4>Visitor:</h4>
      <a href='https://clustrmaps.com/site/1bzo8'  title='Visit tracker'><img width="100%" src='//clustrmaps.com/map_v2.png?cl=ffffff&w=1600&t=n&d=fozTtj2Y_h1aaQASPJCSEFQQC-fljE72l2Moaq0pj1E'/></a>
    </>
  );
}

function Home() {
  return (
    <App>
      <Abstract />
      <hr />
      {/* <OfficeHours /> */}
      <hr />
      <Contact />
    </App>
  );
}

export default Home;
