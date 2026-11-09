export default function VoteResult({ results }) {
  if (!results.length) return <p>Még nincs megjeleníthető eredmény.</p>;
  const highest = Math.max(...results.map((result) => Number(result.votes_count)));
  return (
    <div>
      {results.map((result) => (
        <p key={result.name}>
          {result.name}: <strong>{result.votes_count} szavazat</strong>
          {Number(result.votes_count) === highest ? ' ★' : ''}
        </p>
      ))}
    </div>
  );
}
