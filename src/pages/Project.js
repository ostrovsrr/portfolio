import { useParams } from 'react-router-dom';
import BtnDeployed from '../components/btnDeployed/BtnDeployed';
import { projects } from './../helpers/projectsList';

const Project = () => {
  const { id } = useParams();
  const project = projects[id];

  return (
    <main className="section">
      <div className="container">
        <div className="project-details">
          <h1 className="title-1">{project.title}</h1>

          <a href={project.viewLink || project.gitHubLink} target="_blank">
            <img
              src={project.imgBig}
              alt={project.title}
              className="project-details__cover"
            />
          </a>

          <div className="project-details__desc">
            <p>Skills: {project.skills}</p>
          </div>

          {project.gitHubLink && (
            <BtnDeployed gitHubLink={project.gitHubLink} />
          )}
          {project.viewLink && <BtnDeployed viewLink={project.viewLink} />}
        </div>
      </div>
    </main>
  );
};

export default Project;
