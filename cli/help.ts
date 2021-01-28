import {ValidCommands} from '../cli.ts'

/**
 * Command to show the help info
 */
export default function help(version, command: ValidCommands | null) {
  if (!command) {
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

To get help with a command
    lume COMMAND --help

USAGE:
    lume [COMMAND] [OPTIONS]

COMMANDS:
        build      Build the site. It's the default command
        init       Creates a _config.js file
        run        Run an user script
        upgrade    Upgrade 🔥lume to the latest version
        update     Update the version of the lume modules imported in a _config.js file

OPTIONS:
    -h, --help     Prints help information
    -v, --version  Prints version information
        --root     Set a different root path (by default is cwd)
        --src      Set/override the src option
        --dest     Set/override the dest option
        --dev      Run lume in development mode
        --location Set/override the location option
        --serve    Starts the webserver
        --port     Change the default port of the webserver (from 3000)
`);
  }
}
