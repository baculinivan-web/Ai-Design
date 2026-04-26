import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { MainPage } from './components/MainPage';
import './styles/theme.css';

function App() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <MainPage />
    </ThemeProvider>
  );
}

export default App;
