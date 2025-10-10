// Colors used for representing density on the map legend
export enum LegendColors {
  Green = '#009900',
  Yellow = '#FF9900',
  Red = '#FF3300',
  Gray = '#708090',
}

// A link response from pygeoapi
interface Links {
  type: string
  rel: string
  title?: string
  href: string
  length?: number
}

// Trace represents data that is used for plotting the history, plotting the datastream as timeseries
// or displaying the timeseries as a table
export interface Trace {
  x: string[]
  // possible to have a graph without y values if we are just plotting history and want to show the number of observations
  y?: number[]
  type: string
  marker?: {
    color: string
  }
  xbins: {
    size: number
  }
  name?: string
}

// Any of the properties in the items response could be a potential datastream
export type Datastreams = Array<ItemsResponse['features'][0]['properties']>

// Represents one feature within the feature collection of a OAF items/ response
export interface Feature {
  id: string
  geometry: {
    type: 'Point'
    coordinates: number[]
  }
  properties: {
    id: string
    name: string
    description: string

    // Station GeoJSON
    traditional_station_identifier?: string
    barometer_height?: number
    facility_type?: string
    territory_name?: string
    url?: string
    topic?: string
    topics?: string[]
    status?: string
    num_obs?: number

    // Observation GeoJSON
    phenomenonTime?: string
    reportId?: string
    reportTime?: string
    units?: string
    value?: number
    wigos_station_identifier?: string

    // Message GeoJSON
    datetime?: string
    pubtime?: string
  }
  links: Links[]
}

// Represents the JSON response from the OAFeat endpoint ${oapi}/collections/${wmo-urn}/items
export interface ItemsResponse {
  type: 'FeatureCollection'
  features: Feature[]
  numberMatched: number
  numberReturned: number
  links: Links[]
}

// Represents one feature within the feature collection of a OAR items/ response
export interface DiscoveryMetadata {
  id: string;
  conformsTo: string[];
  type: "Feature";
  wis2box: {
    topic_hierarchy: string;
    centre_id: string;
    data_mappings: {
      plugins: {
        [key: string]: {
          plugin: string;
          notify: boolean;
          buckets?: string[];
          "file-pattern": string;
          template?: string;
        }[];
      };
    };
  };
  time: {
    interval: [string, string];
    resolution: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: {
    type: string;
    identifier: string;
    title: string;
    description: string;
    language: {
      code: string | null;
    };
    keywords: string[];
    themes: {
      concepts: {
        id: string;
        title: string;
      }[];
      scheme: string;
    }[];
    contacts: {
      organization: string;
      emails: { value: string }[];
      addresses: { country: string }[];
      links: { rel: string; href: string; type: string }[];
      roles: string[];
    }[];
    created: string;
    updated: string;
    "wmo:dataPolicy": string;
    "wmo:topicHierarchy": string;
    id: string;
  };
  links: {
    href: string;
    type: string;
    name?: string;
    rel: string;
    title: string;
    channel?: string;
  }[];
}


// Represents the JSON response from the OARec endpoint ${oapi}/collections/discovery-metadata/items
export interface MetadataResponse {
  type: 'FeatureCollection'
  features: DiscoveryMetadata[]
  numberMatched: number
  numberReturned: number
  links: Links[]
}

// Superset of Feature, with additional helper fields for easier use in the frontend
export interface Dataset extends DiscoveryMetadata {
  hasSynop: boolean
  id: string
  bbox: number[]
  // links in a format that can be used by the wis2box UI
  uiLinks: Array<{
    href: string | undefined
    target: string | undefined
    type: string
    msg: string
    icon: string
  }>
}

// Represents the JSON response from the OAF /collections endpoint
// when requesting multiple collections.
export interface CollectionsResponse {
  collections: {
    id: 'stations' | 'messages' | 'discovery-metadata' | string // could be a few special collections or an arbitrary string
    title: string
    description: string
    keywords: string
    links: Links[]
    extent: {
      spatial: {
        bbox: number[][]
        crs: string
      }
    }
    crs: string
    storageCRS: string
  }[]
  links: Links[]
}

// Represents the JSON response from the OAF /process endpoint
export interface ProcessResponse {
  code: 'success' | string
  id: string
  value: ItemsResponse
}

// Represents the different collection choices a user can select on the DatasetView view
export interface Choices {
  collection: {
    title: string
  }
  discovery_metadata: ItemsResponse['features']
  stations: ItemsResponse
  collections: CollectionsResponse['collections']
  station: Set<string>
  datastream: {
    id: string
    index: string
    name: string
    units: string
  }
}
