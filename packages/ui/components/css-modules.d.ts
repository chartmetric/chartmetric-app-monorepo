/* eslint-disable import-x/no-default-export --
 * The bundler hands back one default object; the shape is not ours to choose.
 */
/**
 * CSS modules are resolved by the bundler, so TypeScript needs to be told what
 * importing one yields. Kept here rather than pulling in `vite/client`, which
 * would also declare globals this package does not use.
 */
declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;

  export default classes;
}
