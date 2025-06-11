function HomePage() {
  return (
    <div className="page-container">
      <div className="page-content">
        <div className="main-content">
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

          <section className="home-section" style={{ textAlign: 'center', marginTop: '40px' }}>
            <h2 style={{ 
              fontWeight: 'bold',
              color: '#2c3e50',
              fontSize: '2rem',
              marginBottom: '20px'
            }}>
              Join our community today!
            </h2>
          </section>
        </div>
        
        <div className="sidebar-space">
          <img 
            src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
            alt="Cybersecurity illustration" 
            style={{
              width: '100%',
              height: '50%',
              maxWidth: '500px',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
          <p style={{ 
            marginTop: '20px', 
            textAlign: 'center', 
            color: '#6c757d',
            fontSize: '14px',
            fontStyle: 'italic'
          }}>
            Protecting organizations through expert cybersecurity collaboration
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
