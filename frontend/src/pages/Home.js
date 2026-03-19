import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Velkommen til Den Danske Donation</h1>
      <Link to="/campaigns"><button>Se kampagner</button></Link>
    </div>
  );
}

export default Home;
