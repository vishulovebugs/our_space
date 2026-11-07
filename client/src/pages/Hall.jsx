import GameCanvas from "../components/GameCanvas.jsx";

export default function Hall({ character, username, onLogout }) {
  return (
    <div className="hall">
      <GameCanvas character={character} username={username} />
      <button type="button" className="logout" onClick={onLogout}>
        Log out
      </button>
    </div>
  );
}
