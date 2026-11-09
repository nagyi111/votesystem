import { useEffect, useState } from 'react';
import VoteList from './components/VoteList.jsx';
import VoteForm from './components/VoteForm.jsx';
import VoteResult from './components/VoteResult.jsx';
import './App.css';

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || 'Hiba történt.');
  return data;
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [options, setOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    request('/api/categories')
      .then((rows) => {
        setCategories(rows);
        if (rows.length) setCategoryId(String(rows[0].id));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    setSelectedOption(null);
    setMessage('');
    Promise.all([
      request(`/api/options/${categoryId}`),
      request(`/api/result/${categoryId}`),
    ])
      .then(([optionRows, resultRows]) => {
        setOptions(optionRows);
        setResults(resultRows);
      })
      .catch((err) => setError(err.message));
  }, [categoryId]);

  async function vote(username) {
    setError('');
    setMessage('');
    try {
      const user = await request('/api/users/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const check = await request(`/api/check/${categoryId}/${user.id}`);
      if (check.has_voted) {
        setMessage('Ebben a kategóriában már szavaztál.');
        return;
      }
      const answer = await request('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, optionId: selectedOption.id }),
      });
      setMessage(answer.msg);
      setSelectedOption(null);
      setResults(await request(`/api/result/${categoryId}`));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <h1>VoteSystem</h1>
      <label htmlFor="category">Kategória:</label>
      <select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <h2>Szavazási lehetőségek</h2>
      <VoteList options={options} selectedOption={selectedOption} onSelect={setSelectedOption} />
      <VoteForm selectedOption={selectedOption} onVote={vote} />
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="error">{error}</p>}
      <h2>Eredmények</h2>
      <VoteResult results={results} />
    </main>
  );
}
