import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import QuestionPage from './pages/QuestionPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<QuestionPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
