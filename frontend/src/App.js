import './App.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Den Danske Donation</div>
      <ul className="navbar-links">
        <li><a href="#how-it-works">Hvordan det virker</a></li>
        <li><a href="#causes">Formål</a></li>
        <li><a href="#about">Om os</a></li>
        <li><a href="#donate" className="btn btn-primary">Doner nu</a></li>
      </ul>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Gør en forskel i Danmark</h1>
        <p className="hero-subtitle">
          En simpel platform, der forbinder donorer med velgørende formål
          over hele landet.
        </p>
        <div className="hero-actions">
          <a href="#donate" className="btn btn-primary btn-large">Kom i gang</a>
          <a href="#how-it-works" className="btn btn-outline btn-large">Læs mere</a>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Features() {
  const features = [
    {
      icon: '❤️',
      title: 'Støt lokale formål',
      description: 'Find og støt velgørende organisationer nær dig med blot få klik.',
    },
    {
      icon: '🔒',
      title: 'Sikre betalinger',
      description: 'Alle donationer behandles sikkert og transparent.',
    },
    {
      icon: '📊',
      title: 'Følg din indflydelse',
      description: 'Se præcis, hvordan dine donationer gør en forskel.',
    },
  ];

  return (
    <section id="how-it-works" className="features">
      <h2>Hvordan det virker</h2>
      <div className="card-grid">
        {features.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function CauseCard({ title, description, raised, goal }) {
  const progress = Math.min((raised / goal) * 100, 100);
  return (
    <div className="card cause-card">
      <div className="cause-image-placeholder" />
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="cause-meta">
        <span>{raised.toLocaleString('da-DK')} kr. samlet</span>
        <span>Mål: {goal.toLocaleString('da-DK')} kr.</span>
      </div>
      <button className="btn btn-primary">Doner</button>
    </div>
  );
}

function Causes() {
  const causes = [
    { title: 'Børn & Uddannelse', description: 'Hjælp børn i udsatte positioner med bedre uddannelsesmuligheder.', raised: 42500, goal: 100000 },
    { title: 'Madbanken', description: 'Bekæmp madspild og sørg for, at ingen går sultne i seng.', raised: 78000, goal: 80000 },
    { title: 'Mental Sundhed', description: 'Støt initiativer der fremmer mental trivsel i lokalsamfundet.', raised: 15000, goal: 50000 },
  ];

  return (
    <section id="causes" className="causes">
      <h2>Aktuelle formål</h2>
      <div className="card-grid">
        {causes.map((c) => (
          <CauseCard key={c.title} {...c} />
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} Den Danske Donation. Alle rettigheder forbeholdes.</p>
    </footer>
  );
}

function App() {
  return (
    <div className="App">
      <Navbar />
      <Hero />
      <Features />
      <Causes />
      <Footer />
    </div>
  );
}

export default App;
