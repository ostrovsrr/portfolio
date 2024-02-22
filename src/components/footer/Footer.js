import "./style.css";

import linkedIn from "./../../img/icons/linkedin.png";
import gitHub from "./../../img/icons/github.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__wrapper">
          <ul className="social">
            <li className="social__item">
              <a href="https://github.com/ostrovsrr" target="_blank">
                <img className="social__image" src={gitHub} alt="Link" />
              </a>
            </li>
            <li className="social__item">
              <a
                href="https://www.linkedin.com/in/rodion-ostrovskii/"
                target="_blank"
              >
                <img className="social__image" src={linkedIn} alt="Link" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
