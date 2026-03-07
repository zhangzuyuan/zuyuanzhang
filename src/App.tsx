
import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/research", label: "Research" },
  { to: "/publications", label: "Publications" },
  { to: "/experience", label: "Experience" },
  { to: "/teaching", label: "Teaching" },
  { to: "/service", label: "Service" },
  { to: "/timeline", label: "Timeline" },
  { to: "/cv", label: "CV" },
  { to: "/news", label: "News" },
];

function App({ children }: LayoutProps) {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  return (
    <div className="site-shell">
      <Navbar expand="lg" className="site-navbar" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="site-brand">
            Zuyuan Zhang
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="site-navbar-nav" />
          <Navbar.Collapse id="site-navbar-nav">
            <Nav className="ms-auto">
              {navItems.map((item) => (
                <Nav.Link
                  as={Link}
                  to={item.to}
                  key={item.to}
                  className={location.pathname === item.to ? "is-active" : ""}
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="site-main">
        <Container>{children}</Container>
      </main>

      <footer className="site-footer">
        <Container>
          <div className="site-footer-inner">
            <div className="footer-left">
              <div className="footer-name">Zuyuan Zhang</div>
              <div className="footer-meta">
                Ph.D. Candidate · The George Washington University
              </div>
            </div>

            <div className="footer-right">
              <a href="mailto:zuyuan.zhang@gwu.edu" className="footer-link">
                Email
              </a>
              <a
                href={`${process.env.PUBLIC_URL}/files/cv.pdf`}
                target="_blank"
                rel="noreferrer"
                className="footer-link"
              >
                CV
              </a>
              <a
                href="https://scholar.google.com/"
                target="_blank"
                rel="noreferrer"
                className="footer-link"
              >
                Scholar
              </a>
              <a
                href="https://github.com/"
                target="_blank"
                rel="noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="site-footer-bottom">
            © {currentYear} Zuyuan Zhang. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default App;
// import { ReactNode } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { Navbar, Container, Nav } from "react-bootstrap";

// interface LayoutProps {
//   children: ReactNode;
// }

// const navItems = [
//   { to: "/research", label: "Research" },
//   { to: "/publications", label: "Publications" },
//   { to: "/experience", label: "Experience" },
//   { to: "/teaching", label: "Teaching" },
//   { to: "/service", label: "Service" },
//   { to: "/cv", label: "CV" },
//   { to: "/news", label: "News" },
//   { to: "/timeline", label: "Timeline" },
// ];

// function App({ children }: LayoutProps) {
//   const location = useLocation();

//   return (
//     <div className="site-shell">
//       <Navbar expand="lg" className="site-navbar" sticky="top">
//         <Container>
//           <Navbar.Brand as={Link} to="/" className="site-brand">
//             Zuyuan Zhang
//           </Navbar.Brand>
//           <Navbar.Toggle aria-controls="site-navbar-nav" />
//           <Navbar.Collapse id="site-navbar-nav">
//             <Nav className="ms-auto">
//               {navItems.map((item) => (
//                 <Nav.Link
//                   as={Link}
//                   to={item.to}
//                   key={item.to}
//                   className={location.pathname === item.to ? "is-active" : ""}
//                 >
//                   {item.label}
//                 </Nav.Link>
//               ))}
//             </Nav>
//           </Navbar.Collapse>
//         </Container>
//       </Navbar>

//       <main className="site-main">
//         <Container>{children}</Container>
//       </main>

//       <footer className="site-footer">
//         <Container>
//           <hr />
//           <p className="text-center text-muted mb-0">
//             © 2026 Zuyuan Zhang. Built with React and Bootstrap.
//           </p>
//         </Container>
//       </footer>
//     </div>
//   );
// }

// export default App;

// import { Link } from "react-router-dom";
// import { Navbar, Container, Nav } from "react-bootstrap";

// function App(props: any) {
//   return (
//     <>
//       <Navbar expand="lg" style={{ marginBottom: "1rem" }}>
//         <Container>
//           <Navbar.Brand as={Link} to="/">
//             Zuyuan Zhang
//           </Navbar.Brand>
//           <Navbar.Toggle aria-controls="basic-navbar-nav" />
//           <Navbar.Collapse id="basic-navbar-nav">
//             <Nav>
//               <Nav.Link as={Link} to="/experience">
//                 Experience
//               </Nav.Link>
//               <Nav.Link as={Link} to="/publications">
//                 Publications
//               </Nav.Link>
//               <Nav.Link as={Link} to="/teaching">
//                 Teaching
//               </Nav.Link>
//               <Nav.Link as={Link} to="/service">
//                 Service
//               </Nav.Link>
//               <Nav.Link as={Link} to="/timeline">
//                 Timeline
//               </Nav.Link>
//               {/* <Nav.Link as={Link} to="/trivia">
//                 Trivia
//               </Nav.Link> */}
//             </Nav>
//           </Navbar.Collapse>
//         </Container>
//       </Navbar>
//       <Container style={{ minHeight: "1000px" }}>{props.children}</Container>

//       <footer style={{ marginTop: "5rem", marginBottom: "3rem" }}>
//         <Container>
//           <hr />
//           <p className="text-center">
//             &copy; 2023 Zuyuan Zhang. The&nbsp;
//             {/* <a href="https://github.com/handk85/homepage">
//               source code of this homepage
//             </a>
//             &nbsp;is available at Github. Please feel free to extend it for your
//             own homepage. */}
//           </p>
//         </Container>
//       </footer>
//     </>
//   );
// }

// export default App;
