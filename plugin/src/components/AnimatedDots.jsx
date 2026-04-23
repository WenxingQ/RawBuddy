import React, { useState, useEffect } from 'react';

export default function AnimatedDots() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ display: 'inline-block', width: 18, textAlign: 'left' }}>
      {'.'.repeat(count)}
    </span>
  );
}
