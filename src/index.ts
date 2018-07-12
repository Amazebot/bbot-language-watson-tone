import 'dotenv/config'
import { inspect } from 'util'
import * as yargs from 'yargs'
import * as Watson from 'watson-developer-cloud'

const watsonHost = 'https://' + process.env.WATSON_SERVICE_HOSTNAME

/** Send text string to Watson for sentiment and tone analysis */
function watsonAnalyze (text: string): Promise<any> {
  const nlu: Promise<any> = new Promise((resolve, reject) => {
    new Watson.NaturalLanguageUnderstandingV1({
      iam_apikey: process.env.WATSON_NATURAL_LANGUAGE_UNDERSTANDING_APIKEY,
      url: `${watsonHost}/natural-language-understanding/api`,
      version: '2017-02-27'
    }).analyze({
      text, features: { sentiment: {}, keywords: {} }
    }, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
  const tone: Promise<any> = new Promise((resolve, reject) => {
    new Watson.ToneAnalyzerV3({
      iam_apikey: process.env.WATSON_TONE_ANALYZER_APIKEY,
      url: `${watsonHost}/tone-analyzer/api`,
      version: '2017-09-21'
    }).tone({
      text
    }, (err: Error, result: any) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
  return Promise.all([nlu, tone]).then((results) => {
    return { nlu: results[0], tone: results[1] }
  })
}

/** Get results from Watson for Sentiment and Tone and format as NLU result */
async function analyse (text: string): Promise<any> {
  const results = await watsonAnalyze(text)
  // @todo...refactor using NLU interface and helpers
  
  const nlu: any = {}
  nlu.sentiment = [{
    id: results.nlu.sentiment.document.label,
    score: results.nlu.sentiment.document.score
  }]

  nlu.phrases = []
  for (let i in results.nlu.keywords) {
    console.log(results.nlu.keywords[i])
    results.nlu.keywords.push({
      name: results.nlu.keywords[i].text,
      score: results.nlu.keywords[i].relevance
    })
  }

  nlu.language = [{
    id: results.nlu.language
  }]

  nlu.tone = []
  for (let i in results.tone.document_tone.tones) {
    nlu.tone.push({
      id: results.tone.document_tone.tones[i].tone_id,
      name: results.tone.document_tone.tones[i].tone_name,
      score: results.tone.document_tone.tones[i].score
    })
  }

  console.log(inspect(nlu, false, 2))
  return nlu
}

/** Get the text to analyse from command line arg */
const argv = yargs.option('text', {
  alias: 't',
  type: `string`,
  describe: 'The text to analyse'
}).config().argv

if (!argv.text) throw new Error('Dev script requires "--text" argument to analyse')

/** Execute on load */
analyse(argv.text)
