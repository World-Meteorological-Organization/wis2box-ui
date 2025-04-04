import type { Feature, ItemsResponse } from './types'
import { useGlobalStateStore } from '@/stores/global'

// create an enum for green, yellow, red, and gray as hex
export enum ObservationLevel {
  'green' = '#4CAF50',
  'yellow' = '#FFC107',
  'red' = '#F44336',
  'gray' = '#757575',
}

export function getNameTime(name: string, phenomenonTime: string) {
  let cleanedName = clean(name)

  if (phenomenonTime.includes('/')) {
    const splitTime = phenomenonTime.split('/')
    const timeDifference =
      new Date(splitTime[1]).getTime() - new Date(splitTime[0]).getTime()
    const minuteDifference = Math.floor(timeDifference / (1000 * 60))
    const hourDifference = Math.floor(timeDifference / (1000 * 3600))

    if (hourDifference > 0) {
      cleanedName = `${cleanedName} (${hourDifference} hr)`
    } else if (minuteDifference > 0) {
      cleanedName = `${cleanedName} (${minuteDifference} min)`
    }
  }

  return cleanedName
}

export function clean(word: string | null | undefined) {
  if (!word) {
    return ''
  }

  if (word.search(/\d+$/) > -1) {
    // String ends with a number
    const endingNumber = word.match(/\d+$/g)
    if (endingNumber && endingNumber.length > 0) {
      word = word.replace(endingNumber.toString(), `_${endingNumber}`)
    }
  }

  if (word.search(/^\d+/) > -1) {
    // String starts with a number
    const leadingNumber = word.match(/^\d+/g)
    if (leadingNumber && leadingNumber.length > 0) {
      word = word.replace(leadingNumber.toString(), `${leadingNumber}_`)
    }
  } else {
    word = word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
  }

  return word.replace(/_/g, ' ') // replace all instances of _ with a space
}

export function hasLinks(feature: Feature) {
  return feature && feature.links && feature.links.length > 0
}

// For every feature in a feature array, extract the value of the specified key
// and return the array of values. Handle cases where the key is nested
export function getColumnFromKey<T extends keyof Feature['properties']>(
  features: Feature[],
  key: T,
): Array<Feature['properties'][T]> {
  const result: Array<Feature['properties'][T]> = []

  const split = key.toString().split('.')

  if (split.length === 1) {
    for (const feature of features) {
      const row = feature.properties[key]
      if (row !== undefined) {
        result.push(row)
      }
    }
  } else {
    for (const feature of features) {
      // need to disable any check here since there could be an arbitrary key here, nested in arbitrary ways
      // since it is coming from the user's server
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let properties: any = feature.properties

      // if the split has multiple parts, we iterate through each one until we access the most deeply nested one
      for (const part of split) {
        if (
          properties &&
          typeof properties === 'object' &&
          part in properties
        ) {
          properties = properties[part]
        } else {
          properties = undefined
          break
        }
      }
      if (properties !== undefined) {
        result.push(properties)
      }
    }
  }

  return result
}

// get total number of OAF features from enpoint
export async function fetchTotalFeatures(urlWithParams: string): Promise<number> {
  const hitsURL = addParam(urlWithParams, 'resulttype', 'hits');

  const response = await fetchWithToken(hitsURL)
  if (response.ok) {
    const hits: ItemsResponse = await response.json()

    return hits.numberMatched;
  } else {
    throw new Error('Failed to fetch hits')
  }
}

// Fetch features using the request built in DataViewer
export async function fetchOAFFeatures(urlWithParams: string) {

    const featuresResponse = await fetchWithToken(urlWithParams)
    if (featuresResponse.ok) {
      return featuresResponse
    } else {
      throw new Error('Failed to fetch features')
    }

}

// Same as a normal fetch function, but overrides and adds the Authorization header from the global store
export async function fetchWithToken(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const token = useGlobalStateStore().token

  const newInit = { ...init }

  newInit.headers = new Headers(newInit.headers)
  newInit.headers.set('Authorization', `Bearer ${token}`)

  // Call the native fetch with the updated headers
  return fetch(input, newInit)
}

export function isLocalhost(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export function replaceHostname(url: string, newString: string): string {
  return url.replace(/^(http:\/\/[^/]+\/).*\/collections/, `${newString}/collections`);
}

export function replaceParam(url: string, paramName: string, value: string) {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  params.set(paramName, value);

  urlObj.search = params.toString();
  return urlObj.toString();
}

export function addParam(url: string, paramName: string, value: string) {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  params.append(paramName, value);
  urlObj.search = params.toString();
  return urlObj.toString();
}