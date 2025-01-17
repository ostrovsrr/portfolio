import { NavLink } from 'react-router-dom';
import './style.css';

const Project = ({ title, img, index, skills }) => {
  return (
    <NavLink to={`/project/${index}`}>
      <li className="project">
        <img src={img} alt={title} className="project__img" />
        <h3 className="project__title">{title}</h3>
        <div>
          {skills.map((skill) => (
            <p>{skill}</p>
          ))}
        </div>
      </li>
    </NavLink>
  );
};

export default Project;
