import * as cloud from 'watson-developer-cloud'

export interface IWatson {
  host: string,
  nluKey?: string,
  toneKey?: string
}

export class Watson {
  settings: IWatson

  constructor (options: IWatson) {
    if (!options.nluKey && !options.toneKey) throw new Error('[watson] Language analysis requires key for `natural-language-understanding` and/or `tone-analyzer` service.')
    this.settings = Object.assign({}, options)
  }

  analyseNLU (text: string) {
    return new Promise((resolve, reject) => {
      new cloud.NaturalLanguageUnderstandingV1({
        iam_apikey: this.settings.nluKey,
        url: `${this.settings.host}/natural-language-understanding/api`,
        version: '2017-02-27'
      }).analyze({
        text, features: { sentiment: {}, keywords: {} }
      }, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  analyseTone (text: string) {
    return new Promise((resolve, reject) => {
      new cloud.ToneAnalyzerV3({
        iam_apikey: this.settings.toneKey,
        url: `${this.settings.host}/tone-analyzer/api`,
        version: '2017-09-21'
      }).tone({
        text
      }, (err: Error, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  /**
   * Process text with NLU and/or tone cloud services.
   * Resolves with object with result attributes `nlu` and/or `tone`.
   */
  analyse (text: string) {
    const promises = []
    if (this.settings.nluKey) promises.push(this.analyseNLU(text))
    if (this.settings.toneKey) promises.push(this.analyseTone(text))
    return Promise.all(promises).then((results) => {
      const result: { nlu?: any, tone?: any } = {}
      if (this.settings.nluKey) {
        result.nlu = results[0]
        if (this.settings.toneKey) result.tone = results[1]
      } else result.tone = results[0]
      return result
    })
  }
}
