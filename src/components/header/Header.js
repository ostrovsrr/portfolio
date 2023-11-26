import "./style.css";

const Header = () => {
  return (
    <header className="header">
      <div className="header__wrapper">
        <h1 className="header__title">
          <strong>
            Hi, my name is <em>Rodion</em>
          </strong>
          <br />a software developer
        </h1>
        <div className="header__text">
          <p>with passion for bringing my ideas to life</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
