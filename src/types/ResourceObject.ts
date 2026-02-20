export interface ResourceObject {
  uri: string;
  [key: string]: string | number | boolean | null | undefined;
}
