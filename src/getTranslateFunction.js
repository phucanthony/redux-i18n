/*
 * Project: redux-i18n
 * File: getTranslateFunction.js
 */
/* eslint-disable no-new-func */


import React from 'react'
import { Text } from 'react-native';

const interpolateParams = (text, params) => {
  if (!params) {
    return text;
  }

  const children = text.split(/({[^}]+})/g)
    .map((child) => {
      const match = /{(.+)}/g.exec(child);
      if (match) {
        const param = params[match[1]];
        return param ? param : String(param)
      }

      return child;
    });

  // if any children are objects (i.e. react components), wrap in a span, otherwise return as string
  // ignore anything that is falsy, bypassing null, etc
  return children.some(child => child && typeof child === 'object')
    // When React 16 is released, change the span to an identity function for array children,
    // removing the extra dom node
    ? React.createElement(Text, null, ...children)
    : children.join('');
};

const getLangMessages = (translations, lang) => {
  let langMessages = translations[lang];

  // Fall back lang
  if (langMessages === undefined && lang.indexOf('-') > -1) {
    langMessages = translations[lang.split('-')[0]]
  }

  return langMessages;
};

const getOptionValue = (options, key, defaultValue) => {
  if (options === undefined) {
    return defaultValue || null
  }
  return options[key] === undefined ? (defaultValue || null)  : options[key]
};

export default (translations, lang, fallbackLang) => {
  const langMessages = getLangMessages(translations, lang);
  const fallbackLangMessages = fallbackLang ? getLangMessages(translations, fallbackLang) : undefined;
  const plural_rule = getOptionValue(translations.options, 'plural_rule', 'n != 1');
  const plural_number = parseInt(getOptionValue(translations.options, 'plural_number', '2'), 10);
  const suppress_warnings = getOptionValue(translations.options, 'suppress_warnings', false);

  return (textKey, params, comment) => {

    // Checking if textKey contains a pluralize object.
    if (typeof textKey === 'object') {
      textKey = textKey[Number(new Function('n', 'return ' + plural_rule)(params[textKey[plural_number]]))]
    }

    if (!langMessages && !fallbackLangMessages) {
      return interpolateParams(textKey, params);
    }

    let message = langMessages ? langMessages[textKey] : undefined;
    if (message === undefined || message === '') {
      if (!suppress_warnings) {
        console.warn(`Missing translation for id ${textKey} in language ${lang}`);
      }

      // If don't have literal translation and have fallback lang, try
      // to get from there.
      if (fallbackLangMessages) {
        let literal = fallbackLangMessages[textKey];
        if (literal !== undefined && literal !== '') {
          return interpolateParams(literal, params);
        }
      }
      return interpolateParams(textKey, params);
    }
    return interpolateParams(message, params);
  }
}
