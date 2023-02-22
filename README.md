# RYE public packages

Repo for public packages. You can find all published packages [here](https://github.com/orgs/rye-com/packages).

## Create new package

- Create your package in packages directory. Follow the same structure for package.json as in any existing package, make sure that you have `"declaration": true,` in tsconfig.json
- Add your package to [publish workflow](./.github/workflows/publish.yml) in strategy->matrix->package array
- Add your package to [pr workflow](./.github/workflows/pr.yml) in strategy->matrix->package array

## Publish new version of package

- Navigate to the package (example `cd packages/rye-pay`)
- Update version: `npm version patch` / `npm version minor` / `npm version major` (TODO automate this step)
- Commit your changes
- [Create release](https://github.com/rye-com/public-packages/releases/new)
