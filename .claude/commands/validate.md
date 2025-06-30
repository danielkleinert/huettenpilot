Run full validation for the Hüttenplan project to ensure code quality and functionality before committing changes:

1. Build the project with TypeScript compilation and Vite build
2. Run ESLint to check code quality and style 
3. Run all tests to verify functionality

Execute these commands in sequence:
- `yarn build` 
- `yarn lint`
- `yarn test:run`

Stop if any step fails and report the specific errors found.