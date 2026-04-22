import { useState } from 'react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'Sample question?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
  },
];

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  function handleAnswer(index: number) {
    if (index === questions[current].correctIndex) {
      setScore((s) => s + 1);
    }
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      setFinished(true);
    }
  }

  if (finished) {
    return (
      <div>
        <h1>Quiz finished</h1>
        <p>Score: {score} / {questions.length}</p>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div>
      <h1>Quiz</h1>
      <p>{current + 1} / {questions.length}</p>
      <h2>{q.text}</h2>
      <ul>
        {q.options.map((opt, i) => (
          <li key={i}>
            <button onClick={() => handleAnswer(i)}>{opt}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
