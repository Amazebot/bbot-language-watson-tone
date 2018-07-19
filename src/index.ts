import {
  LanguageAdapter,
  TextMessage,
  NaturalLanguageResultsRaw
} from 'bbot'
import { Watson } from './watson'

export class WatsonAdapter extends LanguageAdapter {
  name = 'watson-tone-language-adapter'
  watson = new Watson({
    host: 'https://' + process.env.WATSON_SERVICE_HOSTNAME || 'gateway.watsonplatform.net',
    nluKey: process.env.WATSON_NATURAL_LANGUAGE_UNDERSTANDING_APIKEY,
    toneKey: process.env.WATSON_TONE_ANALYZER_APIKEY
  })

  async start() {
    /** @todo Connection and credential check */
  }
  async shutdown() {}

  /** Get results from Watson for Sentiment and Tone and format as NLU result */
  async process (message: TextMessage) {
    try {
      const processed = await this.watson.analyse(message.toString())
      this.bot.logger.debug(`[watson] process response: ${JSON.stringify(processed)}`)
      const { nlu, tone } = processed
      const results: NaturalLanguageResultsRaw = {}
      if (nlu) {
        results.sentiment = [{
          id: nlu.sentiment.document.label,
          score: nlu.sentiment.document.score
        }]
        results.phrases = []
        for (let i in nlu.keywords) {
          results.phrases.push({
            name: nlu.keywords[i].text,
            score: nlu.keywords[i].relevance
          })
        }
        results.language = [{
          id: nlu.language
        }]
      }
      if (tone) {
        results.tone = []
        for (let i in tone.document_tone.tones) {
          results.tone.push({
            id: tone.document_tone.tones[i].tone_id,
            name: tone.document_tone.tones[i].tone_name,
            score: tone.document_tone.tones[i].score
          })
        }
      }
      this.bot.logger.debug(`[watson] process results: ${JSON.stringify(results)}`)
      return results
    } catch (err) {
      this.bot.logger.error(`[watson] ${err.message}`)
      return
    }
  }
}

/** Standard bBot adapter initialisation method */
export const use = (bot: any) => new WatsonAdapter(bot)