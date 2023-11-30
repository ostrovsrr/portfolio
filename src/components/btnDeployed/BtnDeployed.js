import gitHubIcon from "./gitHub-black.svg";
import "./style.css";

const BtnDeployed = ({ gitHubLink, viewLink }) => {
  const link = gitHubLink || viewLink;
  const text = gitHubLink ? "GitHub repo" : "View Project";
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="btn-outline btnDeployed"
    >
      {gitHubLink && <img src={gitHubIcon} alt="" />}
      {text}
    </a>
  );
};

export default BtnDeployed;
