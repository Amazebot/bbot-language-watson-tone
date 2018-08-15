import * as bBot from 'bbot'
import { Watson } from './watson'

export class WatsonAdapter extends bBot.NLUAdapter {
  name = 'watson-tone-language-adapter'
  watson: Watson

  constructor (bot: typeof bBot) {
    super(bot)
    bot.settings.extend({
      'watson-host': {
        type: 'string',
        description: 'Https gateway. Override default for country specific.',
        default: 'https://gateway.watsonplatform.net'
      },
      'watson-nlu-key': {
        type: 'string',
        description: 'IBM cloud API key for Natural Language Understanding',
      },
      'watson-tone-key': {
        type: 'string',
        description: 'IBM cloud API key for Tone Analysis',
      }
    })
    this.watson = new Watson({
      host: bot.settings.get('watson-host'),
      nluKey: bot.settings.get('watson-nlu-key'),
      toneKey: bot.settings.get('watson-tone-key')
    })
  }

  async start() {
    /** @todo Connection and credential check */
  }
  async shutdown() {}

  /** Get results from Watson for Sentiment and Tone and format as NLU result */
  async process (message: bBot.TextMessage) {
    try {
      const processed = await this.watson.analyse(message.toString())
      this.bot.logger.debug(`[watson] process response: ${JSON.stringify(processed)}`)
      const results: bBot.NaturalLanguageResultsRaw = {}
      if (processed.nlu) {
        results.sentiment = [{
          id: processed.nlu.sentiment.document.label,
          score: processed.nlu.sentiment.document.score
        }]
        results.phrases = []
        for (let i in processed.nlu.keywords) {
          results.phrases.push({
            name: processed.nlu.keywords[i].text,
            score: processed.nlu.keywords[i].relevance
          })
        }
        results.language = [{
          id: processed.nlu.language
        }]
      }
      if (processed.tone) {
        results.tone = []
        for (let i in processed.tone.document_tone.tones) {
          results.tone.push({
            id: processed.tone.document_tone.tones[i].tone_id,
            name: processed.tone.document_tone.tones[i].tone_name,
            score: processed.tone.document_tone.tones[i].score
          })
        }
      }
      return results
    } catch (err) {
      this.bot.logger.error(`[watson] ${err.message}`)
      return
    }
  }
}

/** Standard bBot adapter initialisation method */
module.exports.use = (bot: typeof bBot) => new WatsonAdapter(bot)