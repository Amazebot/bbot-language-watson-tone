import 'dotenv/config'
import { inspect } from 'util'
import * as yargs from 'yargs'
import * as bBot from 'bbot'
import { Watson } from './src/watson'
import { WatsonAdapter } from './src'

/** Setup new Watson Cloud Services wrapper */
const watson = new Watson({
  host: 'https://' + process.env.WATSON_SERVICE_HOSTNAME || 'gateway.watsonplatform.net',
  nluKey: process.env.WATSON_NATURAL_LANGUAGE_UNDERSTANDING_APIKEY,
  toneKey: process.env.WATSON_TONE_ANALYZER_APIKEY
})

/** Analyse text argument, printing results to shell */
async function analyse (text: string, raw: boolean) {
  let result: any
  if (raw) result = await watson.analyse(text)
  else {
    const message = new bBot.TextMessage(new bBot.User(), text)
    result = await new WatsonAdapter(bBot).process(message)
  }
  console.log(inspect(result, false, 4))
}

/** Get the text to analyse from command line arg */
const argv = yargs
  .option('text', {
    alias: 't',
    type: 'string',
    describe: 'The text to analyse'
  })
  .option('raw', {
    alias: 'r',
    type: 'boolean',
    describe: 'Show unformatted results, or in bBot syntax',
    default: true
  })
  .config().argv
if (!argv.text) throw new Error('Dev script requires "--text" argument to analyse')

/** Execute on load */
analyse(argv.text, argv.raw)
