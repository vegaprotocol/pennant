export type InlineDataset = number[] | string[] | boolean[] | object[];

export interface InlineData {
  values: InlineDataset;
}

export type DataSource = InlineData;

export type Data = DataSource;
