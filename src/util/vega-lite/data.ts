export type InlineDataset = number[] | string[] | boolean[] | object[];

export interface InlineData {
  values: InlineDataset;
}

type DataSource = InlineData;

export type Data = DataSource;
