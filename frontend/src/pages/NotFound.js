import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div>
      <h1>404 - Siden blev ikke fundet</h1>
      <Link to="/">Gå til forsiden</Link>
    </div>
  );
}

export default NotFound;
