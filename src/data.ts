import { load } from "js-yaml";

export async function loadYamlFile<T>(path: string): Promise<T> {
  const fullPath = `${process.env.PUBLIC_URL}${path}`;
  const res = await fetch(fullPath, {
    headers: { Accept: "text/plain, text/yaml, text/x-yaml, */*" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${fullPath}: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();

  if (text.trim().startsWith("<!DOCTYPE html") || text.trim().startsWith("<html")) {
    throw new Error(`Expected YAML at ${fullPath}, but got HTML. Check file location/path.`);
  }

  return load(text) as T;
}