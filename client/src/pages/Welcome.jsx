export default function Welcome({ username, onLogout }) {
  return (
    <main className="screen">
      <h1>Pixel Hall</h1>
      <p>Welcome, {username}</p>
      <button type="button" onClick={onLogout}>
        Log out
      </button>
    </main>
  );
}
