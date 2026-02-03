import React, { useState, useEffect } from 'react';
import PipelineBoard from './components/PipelineBoard';
import { LoginView } from './components/LoginView';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <PipelineBoard user={user} onLogout={handleLogout} />
  );
};

export default App;
