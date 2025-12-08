# Run locally

Requirements:
- Node 18+ (check with `node -v`)
- npm (or pnpm/yarn) installed

Steps (PowerShell):

Set-Location -Path 'c:\Users\willi\Downloads\Ideal-today-main\Ideal-today-main'
npm install
npm run dev

Default dev URL: http://localhost:5173

Optional checks:
# run the project's dev-check script
npm run start:check

# run on a different port (PowerShell)
$env:PORT=3000; npm run dev
