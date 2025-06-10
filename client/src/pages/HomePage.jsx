function HomePage() {
  return (
    <div>
      <h1>Welcome to GuardianLink</h1>
      
      <section className="home-section">
        <h2>Who We Are</h2>
        <p>
          We are a platform that helps connect cybersecurity volunteers with nonprofits in need!
        </p>
      </section>

      <section className="home-section">
        <h2>What We Do</h2>
        <p>
          We provide a convenient way for nonprofits to reach out and find the cybersecurity experts and advice they need. 
          Registered cybersecurity volunteers can reach out to nonprofits in need, or simply respond to requests from organizations.
          Our filtering system effortlessly allows the right volunteers to be matched with the right organizations!
        </p>
      </section>

      <section className="home-section">
        <h2>Why We Do It</h2>
        <p>
          We believe that cybersecurity is a fundamental right for all, and that every organization no matter its size or resources,
          should have access to the advice and best practices that will help keep themselves and their clients safe.
        </p>
      </section>
    </div>
  );
}

export default HomePage;
