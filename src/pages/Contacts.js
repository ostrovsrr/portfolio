const Contacts = () => {
  return (
    <main className="section">
      <div className="container">
        <h1 className="title-1">Contacts</h1>

        <ul className="content-list">
          <li className="content-list__item">
            <h2 className="title-2">Location</h2>
            <p>Brampton, Canada</p>
          </li>
          <li className="content-list__item">
            <h2 className="title-2">Phone Number</h2>
            <p>
              <p>289-885-1714</p>
            </p>
          </li>
          <li className="content-list__item">
            <h2 className="title-2">Email</h2>
            <p>
              <a href="mailto:ostrovsr@sheridancollege.ca">
                ostrovsr@sheridancollege.ca
              </a>
            </p>
          </li>
        </ul>
      </div>
    </main>
  );
};

export default Contacts;
