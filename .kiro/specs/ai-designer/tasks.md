# Implementation Plan: AI Designer

## Overview

Веб-приложение для генерации дизайнов приглашений на выпускной с использованием AI-модели GLM4.7 через ClawRouter. React + TypeScript + Vite с минималистичным чёрно-белым интерфейсом и поддержкой dark/light mode.

## Tasks

- [x] 1. Set up project structure and core configuration
  - Initialize Vite + React + TypeScript project
  - Configure project structure (src/components, src/services, src/types, src/styles)
  - Set up CSS variables for theming
  - Configure Vitest for testing
  - _Requirements: 1.1, 1.3, 1.4, 2.1_

- [x] 2. Implement Theme System
  - [x] 2.1 Create ThemeContext and ThemeProvider
    - Implement ThemeContext with 'dark' | 'light' type
    - Add toggleTheme function
    - Implement localStorage persistence for theme
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write property test for theme toggle
    - **Property 1: Theme toggle switches to opposite state**
    - **Validates: Requirements 2.2**

- [x] 3. Implement Core UI Components
  - [x] 3.1 Create ThemeToggle component
    - Button to switch between dark/light modes
    - Display current theme icon
    - _Requirements: 2.1_
  
  - [x] 3.2 Create PromptInput component
    - Large centered input field with placeholder "design anything"
    - Handle onChange and onSubmit events
    - Support disabled state during loading
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 3.3 Create LoadingIndicator component
    - Display loading message during API calls
    - _Requirements: 3.2_
  
  - [x] 3.4 Create ErrorMessage component
    - Display error messages with retry option
    - _Requirements: 3.4, 3.5, 6.4_

- [x] 4. Implement API Client Service
  - [x] 4.1 Create APIClient class
    - Configure ClawRouter endpoint and API key
    - Implement generateDesign method with OpenAI-compatible request format
    - Handle system prompt and user prompt
    - _Requirements: 3.1, 6.1, 6.2, 6.3_
  
  - [x] 4.2 Implement error handling for API calls
    - Handle network errors
    - Handle API errors (4xx, 5xx)
    - Handle service unavailable scenarios
    - _Requirements: 3.4, 3.5, 6.4_

- [x] 5. Implement Image Converter Service
  - [x] 5.1 Create ImageConverter using html-to-image
    - Convert HTML string to PNG data URL
    - Handle conversion options (quality, pixelRatio)
    - _Requirements: 4.1_
  
  - [ ]* 5.2 Write property test for HTML to image conversion
    - **Property 2: HTML to image conversion produces valid output**
    - **Validates: Requirements 4.1**
  
  - [x] 5.3 Implement fallback for conversion errors
    - Display HTML when image conversion fails
    - _Requirements: 4.3_

- [x] 6. Implement Design Preview and Result Components
  - [x] 6.1 Create DesignPreview component
    - Render generated HTML in sandboxed container
    - Trigger image conversion
    - _Requirements: 3.3, 4.1_
  
  - [x] 6.2 Create ImageResult component
    - Display converted PNG image
    - Implement download functionality with custom filename
    - _Requirements: 4.2, 5.1, 5.2, 5.3_

- [x] 7. Implement MainPage and State Management
  - [x] 7.1 Create MainPage component with state management
    - Manage prompt, generatedHTML, generatedImage, isLoading, error state
    - Orchestrate generation flow: prompt → API → HTML → image
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_
  
  - [x] 7.2 Wire all components together in App
    - Wrap with ThemeProvider
    - Compose MainPage with all child components
    - _Requirements: 1.1, 2.1_

- [x] 8. Implement Responsive Design
  - [x] 8.1 Add responsive CSS for all components
    - Support viewport widths 320px to 1920px
    - Adapt input and button sizes for mobile (< 768px)
    - Ensure touch-friendly interactions
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ]* 8.2 Write property test for responsive layout
    - **Property 3: Responsive layout stays within viewport bounds**
    - **Validates: Requirements 7.1**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Integration Testing
  - [ ]* 10.1 Write integration tests for generation flow
    - Test prompt → HTML → image flow
    - Test error handling scenarios
    - _Requirements: 3.1, 3.4, 4.1_
  
  - [ ]* 10.2 Write integration tests for theme persistence
    - Test theme toggle and localStorage persistence
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
