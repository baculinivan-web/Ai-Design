import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from './components/AuthGate';
import { ProjectProvider } from './contexts/ProjectContext';
import { ThemeToggle } from './components/ThemeToggle';
import { AccountMenu } from './components/AccountMenu';
import { MainPage } from './components/MainPage';
import './styles/theme.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <ProjectProvider>
            <div className="top-right-actions">
              <ThemeToggle />
              <AccountMenu />
            </div>
            <MainPage />
          </ProjectProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
