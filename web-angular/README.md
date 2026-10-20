# SalaryNet, Angular front end

The Angular version of the SalaryNet UI. It talks to the same ASP.NET Core API as the Vue app in `../web`, and reuses the framework-free code in `../shared` (API contract, demo engine, payroll calculator, translations).

```bash
npm install
npm start          # http://localhost:4200, proxies /api to the API on port 5080
npm run start:demo # runs without the API, using the in-browser demo engine
npm test
npm run lint
```

See the main [README](../README.md) for the whole project.
