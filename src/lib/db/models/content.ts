import { findByField, findMany } from "../crud";

export async function findSiteContentByKey(key: string) {
  return findByField("site_content", "key", key);
}

export async function findAllSiteContent() {
  return findMany("site_content");
}
