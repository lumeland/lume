/**
 * Command to show the help info
 */
export default async function help(version) {
  console.log(`🔥lume ${version}
A static site generator for Deno

Docs: https://lumeland.github.io/

To build the site:
    lume

To serve the site in localhost
    lume --serve

To update lume to the latest version
    lume update

To run a custom script
    lume run script-name

USAGE:
    lume [<command>] [OPTIONS]

COMMANDS:
        build      Build the site. It's the default command
        init       Creates a _config.js file
        run        Run an user script
        upgrade    Upgrade 🔥lume to the latest version
        update     Update the version of the lume modules imported in a _config.js file

OPTIONS:
        --dest     Set/override the dest option
        --dev      Run lume in development mode
    -h, --help     Prints help information
        --location Set/override the location option
        --port     Change the default port of the webserver (from 3000)
        --root     Set a different root path (by default is cwd)
        --serve    Starts the webserver
        --src      Set/override the src option
    -v, --version  Prints version information
`);
}
