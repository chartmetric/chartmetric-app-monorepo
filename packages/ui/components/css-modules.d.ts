/* eslint-disable import-x/no-default-export --
 * The bundler hands back one default object; the shape is not ours to choose.
 */
declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;

  export default classes;
}
