import { useState } from 'react';

export default function VoteForm({ selectedOption, onVote }) {
  const [username, setUsername] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    try {
      await onVote(username.trim());
    } finally {
      setSending(false);
    }
  }

  if (!selectedOption) return <p>Válassz egy lehetőséget a szavazáshoz!</p>;
  return (
    <section>
      <p>Kiválasztott lehetőség: <strong>{selectedOption.name}</strong></p>
      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)}>Szavazok</button>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="username">Neved:</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={100} />
          <button type="submit" disabled={sending || !username.trim()}>{sending ? 'Mentés...' : 'Szavazat leadása'}</button>
        </form>
      )}
    </section>
  );
}
