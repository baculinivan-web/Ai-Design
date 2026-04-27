import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ThemeToggle } from './components/ThemeToggle';
import { MainPage } from './components/MainPage';
import './styles/theme.css';

function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <ThemeToggle />
        <MainPage />
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;
